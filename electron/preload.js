'use strict';
/** Solo la pantalla local de estado puede pedir «reintentar»; las páginas del servidor no reciben nada. */
const { contextBridge, ipcRenderer } = require('electron');

if (location.protocol === 'file:') {
  contextBridge.exposeInMainWorld('impulsopyme', { retry: () => ipcRenderer.send('retry-connect') });
}
