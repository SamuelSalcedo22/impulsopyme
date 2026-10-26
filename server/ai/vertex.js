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
  const creds = credentialsPath();
  if (!creds) return { configured: false };
  const key = readKey(creds.file);
  const project = process.env.GOOGLE_CLOUD_PROJECT || key?.project_id;
  if (!key || !project) return { configured: false, invalid: true };
  return { configured: true, project, location: config.AI.location, model: config.AI.model, source: creds.source };
}

/** Valida y guarda la llave JSON de la cuenta de servicio con permisos restringidos. */
function saveCredentials(key) {
  const ok = key && typeof key === 'object' && key.type === 'service_account' && key.project_id && key.private_key && key.client_email;
  if (!ok) throw new AppError(400, 'ai.invalid_key');
  fs.mkdirSync(config.CREDENTIALS_DIR, { recursive: true });
  fs.writeFileSync(KEY_FILE, JSON.stringify(key), { mode: 0o600 });
  return status();
}

function removeCredentials() {
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
  const creds = credentialsPath();
  process.env.GOOGLE_APPLICATION_CREDENTIALS = creds.file;

  let client;
  try {
    const { GoogleGenAI } = require('@google/genai');
    client = new GoogleGenAI({ vertexai: true, project: current.project, location: current.location });
  } catch (err) {
    console.error('[vertex] no se pudo iniciar el cliente', err);
    throw new AppError(502, 'ai.unavailable');
  }

  const call = client.models.generateContent({
    model: current.model,
    contents: buildPrompt(stats, locale),
    config: { temperature: 0.3, maxOutputTokens: 1200, responseMimeType: 'application/json' }
  });
  let timer;
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), config.AI.timeoutMs); });

  try {
    const response = await Promise.race([call, timeout]);
    return { ...parseJson(response.text), model: current.model };
  } catch (err) {
    console.error('[vertex] error al generar contenido:', err?.message || err);
    const msg = String(err?.message || '');
    if (msg === 'timeout') throw new AppError(504, 'ai.timeout');
    if (/permission|PERMISSION_DENIED|403|401|UNAUTHENTICATED|credentials/i.test(msg)) throw new AppError(502, 'ai.auth_failed');
    if (/not found|404|NOT_FOUND/i.test(msg)) throw new AppError(502, 'ai.model_unavailable');
    if (/quota|429|RESOURCE_EXHAUSTED/i.test(msg)) throw new AppError(429, 'ai.quota');
    throw new AppError(502, 'ai.unavailable');
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { status, saveCredentials, removeCredentials, narrate, buildPrompt, parseJson };
