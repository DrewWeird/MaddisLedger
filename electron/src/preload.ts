import { contextBridge, ipcRenderer } from 'electron';

const versionArg = process.argv.find((arg) => arg.startsWith('--app-version='));
const appVersion = versionArg ? versionArg.slice('--app-version='.length) : '';

contextBridge.exposeInMainWorld('maddisLedger', {
  appVersion,
  onUpdateStatus: (callback: (payload: unknown) => void) => {
    ipcRenderer.on('update-status', (_event, payload) => callback(payload));
  },
  installUpdateNow: () => ipcRenderer.invoke('update:install-now'),
});
