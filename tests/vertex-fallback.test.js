'use strict';
const test = require('node:test');
const assert = require('node:assert');

/* Simula Vertex: el modelo configurado ya no existe y el siguiente responde. */
process.env.GOOGLE_CREDENTIALS_JSON = JSON.stringify({ type: 'service_account', project_id: 'demo', client_email: 'a@b', private_key: 'k' });
process.env.VERTEX_MODEL = 'gemini-2.5-flash';
process.env.GOOGLE_CLOUD_LOCATION = 'us-central1';
const calls = [];
require.cache[require.resolve('@google/genai')] = {
  exports: {
    GoogleGenAI: class {
      constructor(opts) { this.location = opts.location; }
      get models() {
        return {
          generateContent: async ({ model }) => {
            calls.push(`${model}@${this.location}`);
            if (model === 'gemini-2.5-flash') throw new Error('404 NOT_FOUND: Publisher model was not found');
            return { text: JSON.stringify({ narrative: 'Bien', actions: [] }) };
          }
        };
      }
    }
  }
};
const vertex = require('../server/ai/vertex');

test('si el modelo configurado fue retirado, usa el siguiente disponible y lo recuerda', async () => {
  const first = await vertex.narrate({}, 'es');
  assert.strictEqual(first.model, 'gemini-3.5-flash');
  assert.deepStrictEqual(calls, ['gemini-2.5-flash@us-central1', 'gemini-3.5-flash@global']);
  calls.length = 0;
  await vertex.narrate({}, 'es');
  assert.deepStrictEqual(calls, ['gemini-3.5-flash@global']);
});
