import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { autoUpdater } from 'electron-updater';

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
  });

  // PDF links point at the same-origin backend and open fine in Chromium's built-in PDF viewer
  // via a new window; anything else (external links) is handed to the OS default browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(BACKEND_URL)) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.loadURL(app.isPackaged ? BACKEND_URL : DEV_FRONTEND_URL);

  mainWindow.once('ready-to-show', () => {
    splashWindow?.close();
    mainWindow?.show();
    if (app.isPackaged) {
      autoUpdater.checkForUpdatesAndNotify().catch((err) => console.error('Auto-update check failed', err));
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
