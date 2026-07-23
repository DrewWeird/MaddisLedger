import { contextBridge } from 'electron';

const versionArg = process.argv.find((arg) => arg.startsWith('--app-version='));
const appVersion = versionArg ? versionArg.slice('--app-version='.length) : '';

contextBridge.exposeInMainWorld('maddisLedger', {
  appVersion,
});
