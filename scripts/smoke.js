'use strict';
/**
 * Prueba de humo en navegador real (requiere Playwright: npx playwright install chromium).
 * Arranca el servidor en una carpeta temporal, se registra y recorre todas las secciones
 * verificando que no haya errores de consola.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'impulsopyme-smoke-'));
process.env.DATA_DIR = dir;
process.env.CREDENTIALS_DIR = path.join(dir, 'cred');

(async () => {
  const { chromium } = require('playwright');
  const { start, stop } = require('../server/index');
  const { server, port } = await start({ port: 0 });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  try {
    await page.goto(`http://127.0.0.1:${port}/#/register`);
    await page.fill('[name=name]', 'Prueba Humo');
    await page.fill('[name=username]', 'humo_test');
    await page.fill('[name=password]', 'clave12345');
    await page.click('button[type=submit]');
    await page.waitForSelector('#view .view-in');
    for (const hash of ['dashboard', 'sales', 'sales?tab=history', 'inventory', 'customers', 'suppliers', 'ai', 'ai?tab=alerts', 'ai?tab=assistant', 'reports', 'settings', 'settings?tab=ai']) {
      await page.evaluate((h) => { window.location.hash = `#/${h}`; }, hash);
      await page.waitForSelector('#view .view-in, #view [role="alert"]');
      await page.waitForTimeout(250);
      console.log(`ok  #/${hash}`);
    }
  } finally {
    await browser.close();
    await stop(server);
    fs.rmSync(dir, { recursive: true, force: true });
  }
  if (errors.length) { console.error('Errores de consola:', errors); process.exit(1); }
  console.log('Todo en orden.');
})().catch((e) => { console.error(e); process.exit(1); });
