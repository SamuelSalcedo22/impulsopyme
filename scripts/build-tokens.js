#!/usr/bin/env node
/**
 * Convierte design/tokens.json en public/css/tokens.css.
 * - Resuelve referencias del tipo {global.color.ember.500}
 * - Emite variables CSS con prefijo por nivel: --g-*, --s-*, --c-*
 * Los tokens son la única fuente de verdad: ni el CSS ni los componentes
 * escriben colores o medidas a mano.
 */
const fs = require('node:fs');
const path = require('node:path');

const SRC = path.join(__dirname, '..', 'design', 'tokens.json');
const OUT = path.join(__dirname, '..', 'public', 'css', 'tokens.css');
const PREFIX = { global: 'g', semantic: 's', component: 'c' };

function flatten(obj, trail = [], out = {}) {
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$')) continue;
    const next = [...trail, key];
    if (value && typeof value === 'object') flatten(value, next, out);
    else out[next.join('.')] = value;
  }
  return out;
}

function resolve(value, flat, seen = []) {
  return String(value).replace(/\{([^}]+)\}/g, (_, ref) => {
    if (seen.includes(ref)) throw new Error(`Referencia circular en tokens: ${[...seen, ref].join(' -> ')}`);
    if (!(ref in flat)) throw new Error(`Token inexistente: {${ref}}`);
    return resolve(flat[ref], flat, [...seen, ref]);
  });
}

function cssName(dotted) {
  const [level, ...rest] = dotted.split('.');
  return `--${PREFIX[level]}-${rest.join('-')}`;
}

/**
 * Valor para CSS: los globales se escriben resueltos; las referencias a semánticos y componentes
 * quedan como var(--…), así el modo claro solo redefine los semánticos y todo lo demás lo sigue.
 */
function emit(value, flat) {
  return String(value).replace(/\{([^}]+)\}/g, (_, ref) => {
    if (!(ref in flat)) throw new Error(`Token inexistente: {${ref}}`);
    return ref.startsWith('global.') ? resolve(flat[ref], flat) : `var(${cssName(ref)})`;
  });
}

function build() {
  const tokens = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  const { theme = {}, ...base } = tokens;
  const flat = flatten(base);
  const lines = Object.keys(flat).map((key) => `  ${cssName(key)}: ${emit(flat[key], flat)};`);
  const blocks = Object.entries(theme).map(([name, values]) => {
    const over = flatten(values, ['semantic']);
    for (const key of Object.keys(over)) if (!(key in flat)) throw new Error(`El tema ${name} redefine un token que no existe: ${key}`);
    const body = Object.keys(over).map((key) => `  ${cssName(key)}: ${emit(over[key], flat)};`);
    return `:root[data-theme="${name}"] {\n  color-scheme: ${name};\n${body.join('\n')}\n}\n`;
  });
  const css = `/* GENERADO por scripts/build-tokens.js desde design/tokens.json. No editar a mano. */\n:root {\n  color-scheme: dark;\n${lines.join('\n')}\n}\n${blocks.join('')}`;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, css);
  console.log(`tokens.css generado con ${lines.length} variables`);
}

if (require.main === module) build();
module.exports = { flatten, resolve, emit, cssName, build };
