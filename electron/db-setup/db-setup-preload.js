const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dbSetupApi', {
  submit: (config) => ipcRenderer.invoke('db-setup:submit', config),
  getDefaults: () => ipcRenderer.invoke('db-setup:get-defaults'),
});
