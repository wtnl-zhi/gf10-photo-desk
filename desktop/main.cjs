/* oxlint-disable typescript/no-require-imports */
const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 4173;
const PROJECT_ROOT = path.resolve(__dirname, '..');
const VINEXT_CLI = path.join(PROJECT_ROOT, 'node_modules', 'vinext', 'dist', 'cli.js');

let mainWindow;
let localServer;
let ownsServer = false;

function isLocalServerReady() {
  return new Promise((resolve) => {
    const request = http.get(`http://127.0.0.1:${PORT}/api/bridge?action=health&ip=192.168.54.1`, (response) => {
      response.resume();
      resolve(response.statusCode === 200);
    });
    request.on('error', () => resolve(false));
    request.setTimeout(600, () => { request.destroy(); resolve(false); });
  });
}

function startLocalServer() {
  localServer = spawn(process.execPath, [VINEXT_CLI, 'dev', '--host', '127.0.0.1', '--port', String(PORT)], {
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      BROWSER: 'none',
      NODE_ENV: 'development',
      GF10_DESKTOP: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  ownsServer = true;
  localServer.on('error', (error) => console.error('GF10 local server error:', error));
  localServer.stdout.on('data', (chunk) => console.log(String(chunk).trim()));
  localServer.stderr.on('data', (chunk) => console.error(String(chunk).trim()));
}

async function waitForLocalServer() {
  const deadline = Date.now() + 25_000;
  while (Date.now() < deadline) {
    if (await isLocalServerReady()) return true;
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  return false;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 900,
    minWidth: 920,
    minHeight: 650,
    title: 'GF10 Photo Desk',
    backgroundColor: '#f6f7f5',
    show: false,
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  mainWindow.once('ready-to-show', () => mainWindow.show());
  void mainWindow.loadURL(`http://127.0.0.1:${PORT}/`);
  mainWindow.on('closed', () => { mainWindow = null; });
}

async function boot() {
  if (!(await isLocalServerReady())) startLocalServer();
  if (!(await waitForLocalServer())) {
    await dialog.showMessageBox({ type: 'error', title: 'GF10 Photo Desk', message: '本地服务启动失败', detail: '请确认应用程序文件夹可读写，然后重试。' });
    app.quit();
    return;
  }
  createWindow();
}

void app.whenReady().then(boot);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => { if (ownsServer && localServer && !localServer.killed) localServer.kill('SIGTERM'); });
