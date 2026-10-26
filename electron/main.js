'use strict';
/**
 * Proceso principal de Electron. Arranca el mismo servidor Express que usa la versión web
 * (en un puerto libre y solo en 127.0.0.1) y muestra la interfaz en una ventana de escritorio.
 * Los datos y la llave de Google quedan en la carpeta de datos del usuario, nunca dentro de la app.
 */
const path = require('node:path');
const { app, BrowserWindow, Menu, shell, dialog } = require('electron');

const userData = app.getPath('userData');
process.env.DATA_DIR = process.env.DATA_DIR || path.join(userData, 'data');
process.env.CREDENTIALS_DIR = process.env.CREDENTIALS_DIR || path.join(userData, 'credentials');

let mainWindow = null;
let serverHandle = null;

async function createWindow() {
  const { start } = require('../server/index');
  serverHandle = await start({ port: 0 });
  const url = `http://127.0.0.1:${serverHandle.port}/`;

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 380,
    minHeight: 600,
    backgroundColor: '#18191B',
    title: 'ImpulsoPYME',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false }
  });

  /* Los enlaces externos se abren en el navegador, no dentro de la app. */
  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    if (/^https?:/.test(target)) shell.openExternal(target);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, target) => {
    if (!target.startsWith(url)) { event.preventDefault(); if (/^https?:/.test(target)) shell.openExternal(target); }
  });

  await mainWindow.loadURL(url);
  mainWindow.on('closed', () => { mainWindow = null; });
}

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
    try {
      await createWindow();
    } catch (error) {
      dialog.showErrorBox('ImpulsoPYME', `No se pudo iniciar la aplicación.\n\n${error.message}`);
      app.quit();
    }
    app.on('activate', () => { if (!mainWindow && serverHandle) createWindow().catch(() => {}); });
  });

  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
  app.on('before-quit', () => { try { serverHandle?.server.close(); } catch { /* ya cerrado */ } });
}
