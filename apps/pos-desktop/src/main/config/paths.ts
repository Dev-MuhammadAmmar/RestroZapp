import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import { app } from "electron";
import { WINDOWS_DATA_DIR_NAME } from "@restrozapp/shared";

const LEGACY_DATA_DIR_NAME = "ShikarpurRestaurantPOS";

export function getDataRoot() {
  if (process.env.RESTROZAPP_DATA_ROOT) {
    return process.env.RESTROZAPP_DATA_ROOT;
  }

  if (process.platform === "win32") {
    const driveRoot = path.parse(os.homedir()).root || "C:\\";
    return path.join(driveRoot, WINDOWS_DATA_DIR_NAME);
  }

  return path.join(os.homedir(), WINDOWS_DATA_DIR_NAME);
}

export function migrateLegacyDataRoot() {
  if (process.platform !== "win32" || process.env.RESTROZAPP_DATA_ROOT) return;
  const driveRoot = path.parse(os.homedir()).root || "C:\\";
  const legacyRoot = path.join(driveRoot, LEGACY_DATA_DIR_NAME);
  const targetRoot = getDataRoot();
  if (!fs.existsSync(legacyRoot) || path.resolve(legacyRoot) === path.resolve(targetRoot)) return;

  ensureDir(targetRoot);
  for (const entry of fs.readdirSync(legacyRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const source = path.join(legacyRoot, entry.name);
    const target = path.join(targetRoot, entry.name);
    if (fs.existsSync(target)) continue;
    const sourceDatabase = path.join(source, "restaurant.db");
    if (!fs.existsSync(sourceDatabase) || !isValidRestaurantDatabase(sourceDatabase)) continue;
    ensureDir(target);
    fs.copyFileSync(sourceDatabase, path.join(target, "restaurant.db"));
    for (const directory of ["images", "backups"]) {
      const sourceDirectory = path.join(source, directory);
      if (fs.existsSync(sourceDirectory)) {
        fs.cpSync(sourceDirectory, path.join(target, directory), { recursive: true, errorOnExist: false });
      }
    }
    fs.rmSync(source, { recursive: true, force: true });
  }
}

function isValidRestaurantDatabase(filePath: string) {
  let database: Database.Database | undefined;
  try {
    database = new Database(filePath);
    database.pragma("wal_checkpoint(TRUNCATE)");
    const result = database.pragma("integrity_check", { simple: true });
    return result === "ok";
  } catch {
    return false;
  } finally {
    database?.close();
  }
}

export function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

export function sanitizeRestaurantCode(restaurantCode: string) {
  return restaurantCode.trim().replace(/[^a-zA-Z0-9_-]/g, "_").toUpperCase();
}

export function getRestaurantDir(restaurantCode: string) {
  return ensureDir(path.join(getDataRoot(), sanitizeRestaurantCode(restaurantCode)));
}

export function getDatabasePath(restaurantCode: string) {
  return path.join(getRestaurantDir(restaurantCode), "restaurant.db");
}

export function getBackupDir(restaurantCode: string) {
  return ensureDir(path.join(getRestaurantDir(restaurantCode), "backups"));
}

export function getMenuImageDir(restaurantCode: string) {
  return ensureDir(path.join(getRestaurantDir(restaurantCode), "images", "menu"));
}

export function getRestaurantBrandingDir(restaurantCode: string) {
  return ensureDir(path.join(getRestaurantDir(restaurantCode), "images", "branding"));
}

export function getPdfDir(restaurantCode?: string) {
  const base = restaurantCode ? getRestaurantDir(restaurantCode) : getDataRoot();
  return ensureDir(path.join(base, "pdf"));
}

export function getDesktopExportDir(restaurantCode: string, kind: "CSV" | "PDF") {
  return ensureDir(
    path.join(
      app.getPath("desktop"),
      "RestroZapp Exports",
      sanitizeRestaurantCode(restaurantCode),
      kind,
    ),
  );
}

export function getSecureCredentialsPath() {
  return path.join(ensureDir(getDataRoot()), "device-credentials.bin");
}

export function getActivationCachePath() {
  return path.join(ensureDir(getDataRoot()), "activation-cache.json");
}

export function getInstallationIdentityPath() {
  return path.join(ensureDir(getDataRoot()), "installation-identity.bin");
}
