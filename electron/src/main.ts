import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

// electron-updater is silent by default (no logs anywhere, no UI feedback beyond a native
// notification once a download completes) — wire up a log file and forward every stage to the
// renderer so update problems are actually diagnosable instead of just "nothing happens".
log.transports.file.level = 'info';
autoUpdater.logger = log;
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

const BACKEND_PORT = 5217;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;
const HEALTH_URL = `${BACKEND_URL}/api/health`;
const DEV_FRONTEND_URL = 'http://localhost:5173';
const HEALTH_CHECK_TIMEOUT_MS = 60000;

interface RuntimeConfig {
  connectionString: string;
  dataDirectory: string;
}

interface DbSetupDetails {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
}

let splashWindow: BrowserWindow | null = null;
let dbSetupWindow: BrowserWindow | null = null;
let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcessWithoutNullStreams | null = null;

const userDataPath = app.getPath('userData');
const configPath = path.join(userDataPath, 'config.json');
const dataDirectory = path.join(userDataPath, 'data');

function buildConnectionString(details: DbSetupDetails): string {
  return `Server=${details.host};Port=${details.port};Database=${details.database};User=${details.user};Password=${details.password};`;
}

function readConfig(): RuntimeConfig | null {
  if (!fs.existsSync(configPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch {
    return null;
  }
}

function writeConfig(config: RuntimeConfig): void {
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.mkdirSync(config.dataDirectory, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function createDbSetupWindow(): void {
  dbSetupWindow = new BrowserWindow({
    width: 420,
    height: 620,
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '..', 'db-setup', 'db-setup-preload.js'),
      contextIsolation: true,
    },
  });
  dbSetupWindow.loadFile(path.join(__dirname, '..', 'db-setup', 'db-setup.html'));
  dbSetupWindow.on('closed', () => {
    dbSetupWindow = null;
  });
}

function createSplashWindow(): void {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 420,
    resizable: false,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'splash', 'splash-preload.js'),
      contextIsolation: true,
    },
  });
  splashWindow.loadFile(path.join(__dirname, '..', 'splash', 'splash.html'));
  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

function sendSplashMessage(message: string): void {
  console.log(message);
  splashWindow?.webContents.send('api-startup-message', message);
}

type UpdateStatus =
  | { status: 'checking' }
  | { status: 'available'; version: string }
  | { status: 'not-available' }
  | { status: 'downloading'; percent: number }
  | { status: 'downloaded'; version: string }
  | { status: 'error'; message: string };

function sendUpdateStatus(payload: UpdateStatus): void {
  log.info('[auto-update]', payload);
  mainWindow?.webContents.send('update-status', payload);
}

function wireAutoUpdaterEvents(): void {
  autoUpdater.on('checking-for-update', () => sendUpdateStatus({ status: 'checking' }));
  autoUpdater.on('update-available', (info) => sendUpdateStatus({ status: 'available', version: info.version }));
  autoUpdater.on('update-not-available', () => sendUpdateStatus({ status: 'not-available' }));
  autoUpdater.on('download-progress', (progress) =>
    sendUpdateStatus({ status: 'downloading', percent: Math.round(progress.percent) }));
  autoUpdater.on('update-downloaded', (info) => sendUpdateStatus({ status: 'downloaded', version: info.version }));
  autoUpdater.on('error', (err) => sendUpdateStatus({ status: 'error', message: err.message }));
}

ipcMain.handle('update:install-now', () => {
  autoUpdater.quitAndInstall();
});

function resolveBackendCommand(): { command: string; args: string[]; cwd: string } {
  if (app.isPackaged) {
    const exeName = process.platform === 'win32' ? 'MaddisLedger.Api.exe' : 'MaddisLedger.Api';
    const backendDir = path.join(process.resourcesPath, 'backend');
    return { command: path.join(backendDir, exeName), args: [], cwd: backendDir };
  }

  // Dev mode: run straight from source with `dotnet run` so backend code changes are picked up
  // without a separate publish step.
  const projectDir = path.join(__dirname, '..', '..', 'backend', 'src', 'MaddisLedger.Api');
  return { command: 'dotnet', args: ['run', '--no-launch-profile'], cwd: projectDir };
}

function startBackend(): void {
  const { command, args, cwd } = resolveBackendCommand();

  backendProcess = spawn(command, args, {
    cwd,
    env: {
      ...process.env,
      MADDISLEDGER_CONFIG_PATH: configPath,
      ASPNETCORE_URLS: BACKEND_URL,
      ASPNETCORE_ENVIRONMENT: app.isPackaged ? 'Production' : 'Development',
    },
  });

  backendProcess.stdout.on('data', (data: Buffer) => {
    data.toString().split(/\r?\n/).filter(Boolean).forEach(sendSplashMessage);
  });
  backendProcess.stderr.on('data', (data: Buffer) => {
    data.toString().split(/\r?\n/).filter(Boolean).forEach(sendSplashMessage);
  });
  backendProcess.on('exit', (code) => {
    sendSplashMessage(`Backend process exited with code ${code}.`);
    backendProcess = null;
  });
}

function stopBackend(): void {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}

async function waitForHealthy(timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (!backendProcess) return false; // process died before becoming healthy
    try {
      const response = await fetch(HEALTH_URL);
      if (response.ok) return true;
    } catch {
      // backend not listening yet — keep polling
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      additionalArguments: [`--app-version=${app.getVersion()}`],
    },
  });

  // PDF links point at the backend and open in a new window using Chromium's built-in PDF viewer —
  // which requires webPreferences.plugins explicitly enabled on that new window, or it silently
  // falls back to treating the response as a download (a blank popup plus a save dialog, never
  // actually showing the PDF). Anything else (external links) is handed to the OS browser.
  // In dev mode the main window is loaded from the Vite dev server, not the backend's own origin,
  // so relative PDF links resolve against that dev server (which proxies /api to the backend) —
  // both origins need to be trusted, or dev-mode links wrongly fall through to the OS browser.
  const trustedOrigins = app.isPackaged ? [BACKEND_URL] : [BACKEND_URL, DEV_FRONTEND_URL];
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (trustedOrigins.some((origin) => url.startsWith(origin))) {
      return { action: 'allow', overrideBrowserWindowOptions: { webPreferences: { plugins: true } } };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.loadURL(app.isPackaged ? BACKEND_URL : DEV_FRONTEND_URL);

  mainWindow.once('ready-to-show', () => {
    splashWindow?.close();
    mainWindow?.show();
    if (app.isPackaged) {
      wireAutoUpdaterEvents();
      autoUpdater.checkForUpdates().catch((err) => sendUpdateStatus({ status: 'error', message: err.message }));
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function launchBackendAndMainWindow(): Promise<void> {
  createSplashWindow();
  startBackend();

  const healthy = await waitForHealthy(HEALTH_CHECK_TIMEOUT_MS);
  if (!healthy) {
    sendSplashMessage('Backend did not become ready in time.');

    const choice = await dialog.showMessageBox({
      type: 'error',
      buttons: ['Reconfigure Database', 'Quit'],
      defaultId: 0,
      message: 'MaddisLedger could not start.',
      detail:
        'The backend did not respond in time. This is usually a database connection problem. ' +
        'Would you like to re-enter your database details?',
    });

    stopBackend();
    splashWindow?.close();

    if (choice.response === 0) {
      fs.rmSync(configPath, { force: true });
      beginStartup();
    } else {
      app.quit();
    }
    return;
  }

  createMainWindow();
}

function beginStartup(): void {
  const existingConfig = readConfig();
  if (existingConfig) {
    void launchBackendAndMainWindow();
    return;
  }
  createDbSetupWindow();
}

ipcMain.handle('db-setup:submit', async (_event, details: DbSetupDetails) => {
  try {
    writeConfig({ connectionString: buildConnectionString(details), dataDirectory });
    dbSetupWindow?.close();
    void launchBackendAndMainWindow();
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
});

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const existingWindow = mainWindow ?? splashWindow ?? dbSetupWindow;
    if (existingWindow) {
      if (existingWindow.isMinimized()) existingWindow.restore();
      existingWindow.focus();
    }
  });

  app.whenReady().then(beginStartup);

  app.on('window-all-closed', () => {
    stopBackend();
    app.quit();
  });

  app.on('before-quit', stopBackend);
}
