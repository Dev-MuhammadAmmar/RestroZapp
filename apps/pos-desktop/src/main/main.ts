import path from "node:path";
import { pathToFileURL } from "node:url";
import { app, BrowserWindow, Menu, net, protocol, shell } from "electron";
import { APP_NAME, IPC_CHANNELS } from "@restrozapp/shared";
import { registerIpc } from "./ipc/registerIpc";
import { processPendingDataCommand, runBackupMaintenance, runCloudSnapshotMaintenance } from "./services/backupService";
import { syncNow } from "./services/syncService";
import { closeAllRestaurantDatabases } from "./database/database";
import { startPrintWorker, stopPrintWorker } from "./services/printQueueService";
import { getMenuImageDir, getRestaurantBrandingDir, migrateLegacyDataRoot } from "./config/paths";
import { readActivationState } from "./services/stateStore";
import { startFoodImageLibraryWorker, stopFoodImageLibraryWorker } from "./services/imageLibraryService";

protocol.registerSchemesAsPrivileged([
  {
    scheme: "restrozapp-media",
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);

let mainWindow: BrowserWindow | null = null;
let commandCheckRunning = false;
const EXTERNAL_URL_PREFIXES = [
  "https://restrozapp.vercel.app",
  "https://flrbzrgjsdrwbutkqxsp.supabase.co",
];
const DEFAULT_UI_ZOOM_FACTOR = 0.7;
const MIN_UI_ZOOM_FACTOR = 0.5;
const MAX_UI_ZOOM_FACTOR = 1.3;
const UI_ZOOM_STEP = 0.1;

function setWindowZoom(window: BrowserWindow, zoomFactor: number) {
  const clamped = Math.min(MAX_UI_ZOOM_FACTOR, Math.max(MIN_UI_ZOOM_FACTOR, zoomFactor));
  window.webContents.setZoomFactor(Number(clamped.toFixed(2)));
}

async function checkAdminDataCommands() {
  if (commandCheckRunning) return;
  commandCheckRunning = true;
  try {
    const result = await processPendingDataCommand();
    if (result === "restored") {
      app.relaunch();
      app.exit(0);
    }
  } catch {
    // Offline and transient command failures are retried on the next cycle.
  } finally {
    commandCheckRunning = false;
  }
}

function createWindow() {
  // Completely disable the default menu bar
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1100,
    minHeight: 720,
    title: APP_NAME,
    icon: path.join(app.getAppPath(), "assets", "restrozapp-icon.png"),
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });

  const activeWindow = mainWindow;
  activeWindow.webContents.on("did-finish-load", () => {
    setWindowZoom(activeWindow, DEFAULT_UI_ZOOM_FACTOR);
  });
  activeWindow.webContents.on("before-input-event", (event, input) => {
    if (input.type !== "keyDown" || (!input.control && !input.meta)) return;

    const key = input.key.toLowerCase();
    const zoomIn = key === "+" || key === "=" || key === "add";
    const zoomOut = key === "-" || key === "subtract";
    const resetZoom = key === "0";
    if (!zoomIn && !zoomOut && !resetZoom) return;

    event.preventDefault();
    const currentZoom = activeWindow.webContents.getZoomFactor();
    if (resetZoom) setWindowZoom(activeWindow, DEFAULT_UI_ZOOM_FACTOR);
    else if (zoomIn) setWindowZoom(activeWindow, currentZoom + UI_ZOOM_STEP);
    else setWindowZoom(activeWindow, currentZoom - UI_ZOOM_STEP);
  });
  mainWindow.once("ready-to-show", () => mainWindow?.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (EXTERNAL_URL_PREFIXES.some((prefix) => url.startsWith(prefix))) shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    const currentUrl = mainWindow?.webContents.getURL();
    if (url !== currentUrl) event.preventDefault();
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  app.setName(APP_NAME);
  migrateLegacyDataRoot();
  protocol.handle("restrozapp-media", (request) => {
    const url = new URL(request.url);
    const state = readActivationState();
    const fileName = path.basename(decodeURIComponent(url.pathname));
    if (state.status !== "approved" || !state.restaurant?.restaurantCode) {
      return new Response("Not found", { status: 404 });
    }
    if (url.hostname === "menu" && /^(?:[a-f0-9-]+|library-[a-z0-9-]+)\.jpg$/i.test(fileName)) {
      return net.fetch(pathToFileURL(path.join(getMenuImageDir(state.restaurant.restaurantCode), fileName)).toString());
    }
    if (url.hostname === "branding" && /^restaurant-logo\.(?:png|jpe?g|webp)$/i.test(fileName)) {
      return net.fetch(pathToFileURL(path.join(getRestaurantBrandingDir(state.restaurant.restaurantCode), fileName)).toString());
    }
    return new Response("Not found", { status: 404 });
  });
  registerIpc(() => mainWindow);
  createWindow();
  startPrintWorker(() => mainWindow?.webContents.send(IPC_CHANNELS.printQueueChanged));
  startFoodImageLibraryWorker(() => mainWindow?.webContents.send(IPC_CHANNELS.imageLibraryChanged));
  setTimeout(() => void runBackupMaintenance(), 15_000);
  setTimeout(() => void syncNow(), 10_000);
  setTimeout(() => void runCloudSnapshotMaintenance(), 30_000);
  setTimeout(() => void checkAdminDataCommands(), 15_000);
  setInterval(() => void runBackupMaintenance(), 60 * 60 * 1000);
  setInterval(() => void syncNow(), 60 * 1000);
  setInterval(() => void checkAdminDataCommands(), 30 * 1000);
  setInterval(() => void runCloudSnapshotMaintenance(), 10 * 60 * 1000);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  stopPrintWorker();
  stopFoodImageLibraryWorker();
  closeAllRestaurantDatabases();
});
