'use strict';
const config = require('./config');
const { createApp } = require('./app');
const { openDb, closeDb } = require('./db/connection');
const { ensureDemo } = require('./seed/ensureDemo');

/** Arranca el servidor HTTP. Devuelve una promesa con {server, port} para que Electron pueda usarlo. */
async function start({ port = config.PORT, host = config.HOST } = {}) {
  await openDb(); // conecta con PostgreSQL y crea las tablas que falten
  await ensureDemo();
  const app = createApp();
  return new Promise((resolve, reject) => {
    const server = app.listen(port, host, () => {
      const address = server.address();
      console.log(`ImpulsoPYME listo en http://${host}:${address.port}`);
      resolve({ server, port: address.port });
    });
    server.on('error', reject);
  });
}

function stop(server) {
  return new Promise((resolve) => server.close(() => closeDb().then(resolve)));
}

if (require.main === module) {
  start().catch((err) => {
    console.error('No se pudo iniciar el servidor:', err.message);
    process.exit(1);
  });
}

module.exports = { start, stop };
