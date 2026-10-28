'use strict';
/** Escribe la dirección del servidor en electron/config.json. Uso: npm run set-app-url -- https://mi-app.onrender.com */
const fs = require('node:fs');
const path = require('node:path');

const url = String(process.argv[2] || process.env.APP_URL || '').trim().replace(/\/+$/, '');
if (!/^https:\/\/[^\s/]+$/.test(url) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(url)) {
  console.error('Indica la dirección del servidor, por ejemplo: npm run set-app-url -- https://impulsopyme.onrender.com');
  process.exit(1);
}
fs.writeFileSync(path.join(__dirname, '..', 'electron', 'config.json'), `${JSON.stringify({ appUrl: url }, null, 2)}\n`);
console.log(`Servidor de la app de escritorio: ${url}`);
