'use strict';
/**
 * Proceso principal de Electron. La app de escritorio es una ventana al servidor en línea:
 * no lleva base de datos ni credenciales; todo (datos e IA) vive en el servidor.
 * La dirección sale de IMPULSOPYME_URL, o de electron/config.json (se rellena al construir el instalador).
 */
const path = require('node:path');
const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const config = require('./config.json');

const APP_URL = String(process.env.IMPULSOPYME_URL || config.appUrl || '').replace(/\/+$/, '');
const WAIT_MS = 90 * 1000; // el plan gratuito de Render tarda en despertar

let mainWindow = null;

const statusFile = path.join(__dirname, 'status.html');

/** Espera a que el servidor responda (despierta el plan gratuito) sin bloquear la ventana. */
async function waitForServer(origin, cancelled) {
  const started = Date.now();
  while (Date.now() - started < WAIT_MS) {
    if (cancelled()) return false;
    try {
      const res = await fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(8000) });
      if (res.ok) return true;
    } catch { /* aún no responde */ }
    await new Promise((r) => setTimeout(r, 2500));
  }
  return false;
}

let loadRun = 0;
async function connect() {
  if (!mainWindow) return;
  const run = ++loadRun;
  await mainWindow.loadFile(statusFile);
  const ok = await waitForServer(APP_URL, () => run !== loadRun || !mainWindow);
  if (!mainWindow || run !== loadRun) return;
  if (ok) await mainWindow.loadURL(`${APP_URL}/`);
  else await mainWindow.loadFile(statusFile, { hash: 'offline' });
}

function createWindow() {
  const origin = new URL(APP_URL).origin;
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 380,
    minHeight: 600,
    backgroundColor: '#18191B',
    title: 'ImpulsoPYME',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false }
  });

  /* Los enlaces externos se abren en el navegador; la ventana solo navega dentro del servidor de la app. */
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, target) => {
    if (target.startsWith('file://')) return;
    if (new URL(target).origin !== origin) { event.preventDefault(); if (/^https?:/.test(target)) shell.openExternal(target); }
  });
  mainWindow.on('closed', () => { mainWindow = null; loadRun += 1; });
  return connect();
}

ipcMain.on('retry-connect', () => { connect(); });

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); }
  });

  app.whenReady().then(async () => {
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
      { role: 'editMenu' },
      { label: 'Ver', submenu: [{ role: 'reload' }, { role: 'togglefullscreen' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'resetZoom' }] },
      { role: 'windowMenu' }
    ]));
    if (!/^https?:\/\//.test(APP_URL)) {
      dialog.showErrorBox('ImpulsoPYME', 'Falta la dirección del servidor (appUrl en electron/config.json).');
      app.quit();
      return;
    }
    try {
      await createWindow();
    } catch (error) {
      dialog.showErrorBox('ImpulsoPYME', `No se pudo iniciar la aplicación.\n\n${error.message}`);
      app.quit();
    }
    app.on('activate', () => { if (!mainWindow) createWindow().catch(() => {}); });
  });

  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}
