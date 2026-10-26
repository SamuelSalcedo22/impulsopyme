'use strict';
/** Genera build/icon.png (1024x1024) a partir del logo SVG, para los instaladores de Windows y Mac. */
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  let chromium;
  try { ({ chromium } = require('playwright')); } catch { console.error('Este script solo se usa al cambiar el logo; requiere Playwright.'); process.exit(1); }
  const svg = fs.readFileSync(path.join(__dirname, '../public/assets/logo.svg'), 'utf8');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
  await page.setContent(`<body style="margin:0;background:transparent"><div style="width:1024px;height:1024px">${svg.replace('<svg', '<svg width="1024" height="1024"')}</div></body>`);
  fs.mkdirSync(path.join(__dirname, '../build'), { recursive: true });
  await page.screenshot({ path: path.join(__dirname, '../build/icon.png'), omitBackground: true });
  await browser.close();
  console.log('build/icon.png listo');
})();
