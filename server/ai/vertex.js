'use strict';
/**
 * Integración con Vertex AI a través de @google/genai (modo vertexai).
 * IMPORTANTE: las credenciales viven solo en el servidor. El navegador nunca las recibe;
 * únicamente consulta /api/ai/status y recibe el texto ya generado.
 */
const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');
const { AppError } = require('../errors');

const KEY_FILE = path.join(config.CREDENTIALS_DIR, 'vertex-key.json');

/** GOOGLE_CREDENTIALS_JSON: la llave de la cuenta de servicio como variable de entorno (JSON o base64). Es la forma de uso en el servidor. */
function envKey() {
  const raw = (process.env.GOOGLE_CREDENTIALS_JSON || '').trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8'));
  } catch {
    return { invalid: true };
  }
}

function credentialsPath() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    return { file: process.env.GOOGLE_APPLICATION_CREDENTIALS, source: 'env' };
  }
  if (fs.existsSync(KEY_FILE)) return { file: KEY_FILE, source: 'file' };
  return null;
}

function readKey(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

/** Estado seguro para mostrar en pantalla: nunca incluye claves ni correos de la cuenta de servicio. */
function status() {
  const managed = config.PRODUCTION || Boolean(process.env.GOOGLE_CREDENTIALS_JSON);
  const fromEnv = envKey();
  if (fromEnv) {
    const project = process.env.GOOGLE_CLOUD_PROJECT || fromEnv.project_id;
    if (fromEnv.invalid || !project) return { configured: false, invalid: true, managed };
    return { configured: true, project, location: config.AI.location, model: config.AI.model, source: 'server', managed };
  }
  const creds = credentialsPath();
  if (!creds) return { configured: false, managed };
  const key = readKey(creds.file);
  const project = process.env.GOOGLE_CLOUD_PROJECT || key?.project_id;
  if (!key || !project) return { configured: false, invalid: true, managed };
  return { configured: true, project, location: config.AI.location, model: config.AI.model, source: creds.source, managed };
}

/** Valida y guarda la llave JSON de la cuenta de servicio con permisos restringidos. */
function saveCredentials(key) {
  if (config.PRODUCTION || process.env.GOOGLE_CREDENTIALS_JSON) throw new AppError(403, 'ai.managed_by_server');
  const ok = key && typeof key === 'object' && key.type === 'service_account' && key.project_id && key.private_key && key.client_email;
  if (!ok) throw new AppError(400, 'ai.invalid_key');
  fs.mkdirSync(config.CREDENTIALS_DIR, { recursive: true });
  fs.writeFileSync(KEY_FILE, JSON.stringify(key), { mode: 0o600 });
  return status();
}

function removeCredentials() {
  if (config.PRODUCTION || process.env.GOOGLE_CREDENTIALS_JSON) throw new AppError(403, 'ai.managed_by_server');
  if (fs.existsSync(KEY_FILE)) fs.unlinkSync(KEY_FILE);
}

function buildPrompt(stats, locale) {
  const language = locale === 'en' ? 'English' : 'español de Colombia';
  return `Eres el analista de un pequeño negocio colombiano (${stats.businessType}). Responde en ${language}, con tono cercano, claro y sin tecnicismos.
Usa EXCLUSIVAMENTE los datos de este resumen; no inventes cifras ni productos. Los valores monetarios están en pesos colombianos (COP).
Devuelve SOLO un JSON con esta forma exacta:
{"narrative": "máximo 3 frases con lo más importante de la semana", "actions": [{"title": "acción concreta en máximo 8 palabras", "detail": "una frase que explique por qué, con un dato del resumen"}]}
Entrega entre 3 y 4 acciones, ordenadas por urgencia.

RESUMEN:
${JSON.stringify(stats)}`;
}

function parseJson(text) {
  const clean = String(text || '').replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const parsed = JSON.parse(clean);
  if (typeof parsed.narrative !== 'string' || !Array.isArray(parsed.actions)) throw new Error('forma inesperada');
  return {
    narrative: parsed.narrative.slice(0, 700),
    actions: parsed.actions.slice(0, 5).map((a) => ({ title: String(a.title || '').slice(0, 120), detail: String(a.detail || '').slice(0, 320) }))
  };
}

/** Pide a Gemini (en Vertex AI) un resumen y acciones a partir de las estadísticas ya calculadas. */
async function narrate(stats, locale) {
  const current = status();
  if (!current.configured) throw new AppError(503, 'ai.not_configured');
  const fromEnv = envKey();
  if (!fromEnv) process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath().file;

  const { GoogleGenAI } = require('@google/genai');
  const auth = fromEnv ? { googleAuthOptions: { credentials: fromEnv } } : {};
  const clients = new Map();
  const clientFor = (location) => {
    if (!clients.has(location)) clients.set(location, new GoogleGenAI({ vertexai: true, project: current.project, location, ...auth }));
    return clients.get(location);
  };

  /*
   * Google retira modelos cada pocos meses (gemini-2.5-flash se apagó en octubre de 2026).
   * Se prueba primero el modelo configurado y, si Vertex responde que no existe, los siguientes de la lista.
   * El primero que funciona se recuerda mientras el servidor esté encendido.
   */
  const candidates = [
    { model: current.model, location: current.location },
    ...config.AI.fallbacks
  ].filter((c, i, all) => all.findIndex((x) => x.model === c.model && x.location === c.location) === i);
  if (workingModel) candidates.unshift(workingModel);

  let lastError;
  for (const candidate of candidates) {
    try {
      /*
       * Los modelos Gemini 3 "piensan" antes de responder y ese razonamiento gasta parte del límite de salida;
       * con un límite bajo el JSON llegaba cortado. Se da margen amplio, se fija la forma de la respuesta
       * y, si aun así llega incompleta, se reintenta una vez.
       */
      let result;
      for (let attempt = 0; attempt < 2 && !result; attempt += 1) {
        const response = await withTimeout(clientFor(candidate.location).models.generateContent({
          model: candidate.model,
          contents: buildPrompt(stats, locale),
          config: { temperature: 0.3, maxOutputTokens: 8192, responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA }
        }));
        try {
          result = parseJson(response.text);
        } catch (parseError) {
          console.warn(`[vertex] respuesta incompleta de ${candidate.model} (intento ${attempt + 1}): ${parseError.message}`);
          if (attempt === 1) throw new Error('respuesta incompleta');
        }
      }
      workingModel = candidate;
      return { ...result, model: candidate.model };
    } catch (err) {
      lastError = err;
      const msg = String(err?.message || '');
      if (!/not found|404|NOT_FOUND|not supported|is not available/i.test(msg)) break;
      console.warn(`[vertex] el modelo ${candidate.model} (${candidate.location}) no está disponible; probando el siguiente`);
      if (workingModel === candidate) workingModel = null;
    }
  }

  console.error('[vertex] error al generar contenido:', lastError?.message || lastError);
  const msg = String(lastError?.message || '');
  if (msg === 'timeout') throw new AppError(504, 'ai.timeout');
  if (/permission|PERMISSION_DENIED|403|401|UNAUTHENTICATED|credentials/i.test(msg)) throw new AppError(502, 'ai.auth_failed');
  if (/not found|404|NOT_FOUND/i.test(msg)) throw new AppError(502, 'ai.model_unavailable');
  if (/quota|429|RESOURCE_EXHAUSTED/i.test(msg)) throw new AppError(429, 'ai.quota');
  throw new AppError(502, 'ai.unavailable');
}

let workingModel = null;

/** Forma exacta que debe tener la respuesta del modelo. */
const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    narrative: { type: 'STRING' },
    actions: { type: 'ARRAY', items: { type: 'OBJECT', properties: { title: { type: 'STRING' }, detail: { type: 'STRING' } }, required: ['title', 'detail'] } }
  },
  required: ['narrative', 'actions']
};

async function withTimeout(promise) {
  let timer;
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), config.AI.timeoutMs); });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { status, saveCredentials, removeCredentials, narrate, buildPrompt, parseJson };
