import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import Database from "better-sqlite3";
import {
  APP_VERSION,
  BACKUP_RETENTION,
  SUPABASE_FUNCTIONS_URL,
  type ApiResult,
  type BackupLog,
  type BackupType,
  type CloudSnapshot,
} from "@restrozapp/shared";
import {
  getBackupDir,
  getDatabasePath,
  getMenuImageDir,
  getRestaurantBrandingDir,
} from "../config/paths";
import {
  beginDatabaseReplacement,
  endDatabaseReplacement,
  forceCloseRestaurantDatabase,
  getLatestDatabaseSchemaVersion,
  withActivatedDatabase,
} from "../database/database";
import { getDeviceInfo } from "./deviceService";
import { readActivationState, readDeviceToken } from "./stateStore";
import { pullEventsAfter, syncNow } from "./syncService";

function nowIso() {
  return new Date().toISOString();
}

const MAX_SNAPSHOT_BYTES = 512 * 1024 * 1024;
const MAX_MENU_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_BRANDING_IMAGE_BYTES = 3 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 30_000;
const BACKUP_MANIFEST_NAME = "restrozapp-backup.json";
const BUSINESS_TABLES = [
  "categories",
  "kitchens",
  "menu_items",
  "orders",
  "order_items",
  "customers",
  "local_settings",
  "grocery_store",
  "grocery_vendors",
  "grocery_purchases",
  "grocery_purchase_items",
  "grocery_payments",
  "grocery_returns",
] as const;

type SnapshotQueueItem = {
  id: string;
  snapshotType: "manual" | "weekly" | "monthly";
  fileName: string;
  localPath: string;
  checksumSha256: string;
  databaseChecksum: string;
  checksumKind: "recovery_v1" | "logical_v1";
  syncSequence: number;
  schemaVersion: number;
  sizeBytes: number;
  attempts: number;
  error?: string;
  createdAt: string;
};

type BackupManifest = {
  formatVersion: 1;
  restaurantCode: string;
  createdAt: string;
  recoveryChecksum: string;
  checksumKind: "recovery_v1";
  syncSequence: number;
  schemaVersion: number;
};

function referencedMenuImages(restaurantCode: string) {
  return withActivatedDatabase(restaurantCode, (db) => {
    const rows = db.prepare(`
      SELECT image_file FROM menu_items WHERE image_file <> ''
      UNION
      SELECT image_file FROM order_items WHERE image_file <> ''
    `).all() as Array<{ image_file: string }>;
    return [...new Set(rows.map((row) => row.image_file).filter(Boolean))];
  });
}

type RecoveryAsset = {
  entryName: string;
  data: Buffer;
};

function localRecoveryAssets(restaurantCode: string): RecoveryAsset[] {
  const assets: RecoveryAsset[] = [];
  const imageDir = getMenuImageDir(restaurantCode);
  for (const fileName of referencedMenuImages(restaurantCode)) {
    if (!/^(?:[a-f0-9-]+|library-[a-z0-9-]+)\.jpg$/i.test(fileName)) continue;
    const filePath = path.join(imageDir, fileName);
    if (fs.existsSync(filePath) && fs.statSync(filePath).size <= MAX_MENU_IMAGE_BYTES) {
      assets.push({
        entryName: `images/menu/${fileName}`,
        data: fs.readFileSync(filePath),
      });
    }
  }
  const brandingDir = getRestaurantBrandingDir(restaurantCode);
  for (const fileName of fs.readdirSync(brandingDir)) {
    const filePath = path.join(brandingDir, fileName);
    if (
      /^restaurant-logo\.(?:png|jpe?g|webp)$/i.test(fileName) &&
      fs.statSync(filePath).size <= MAX_BRANDING_IMAGE_BYTES
    ) {
      assets.push({
        entryName: `images/branding/${fileName}`,
        data: fs.readFileSync(filePath),
      });
    }
  }
  return assets.sort((left, right) => left.entryName.localeCompare(right.entryName));
}

function addRestaurantAssets(zip: AdmZip, assets: RecoveryAsset[]) {
  for (const asset of assets) {
    zip.addFile(asset.entryName, asset.data);
  }
}

function localSafetyAssets(restaurantCode: string) {
  const assets: RecoveryAsset[] = [];
  const imageDir = getMenuImageDir(restaurantCode);
  for (const fileName of fs.readdirSync(imageDir)) {
    const filePath = path.join(imageDir, fileName);
    if (
      /^(?:[a-f0-9-]+|library-[a-z0-9-]+)\.jpg$/i.test(fileName) &&
      fs.statSync(filePath).size <= MAX_MENU_IMAGE_BYTES
    ) {
      assets.push({ entryName: `images/menu/${fileName}`, data: fs.readFileSync(filePath) });
    }
  }
  const brandingDir = getRestaurantBrandingDir(restaurantCode);
  for (const fileName of fs.readdirSync(brandingDir)) {
    const filePath = path.join(brandingDir, fileName);
    if (
      /^restaurant-logo\.(?:png|jpe?g|webp)$/i.test(fileName) &&
      fs.statSync(filePath).size <= MAX_BRANDING_IMAGE_BYTES
    ) {
      assets.push({ entryName: `images/branding/${fileName}`, data: fs.readFileSync(filePath) });
    }
  }
  return assets.sort((left, right) => left.entryName.localeCompare(right.entryName));
}

function readEntryData(entry: AdmZip.IZipEntry, maximumBytes: number, label: string) {
  if (entry.header.size <= 0 || entry.header.size > maximumBytes) {
    throw new Error(`${label} has an unsafe size.`);
  }
  const data = entry.getData();
  if (!data.length || data.length > maximumBytes) {
    throw new Error(`${label} has an unsafe size.`);
  }
  return data;
}

function validateArchiveOwnership(zip: AdmZip, restaurantCode: string) {
  const manifestEntry = zip.getEntry(BACKUP_MANIFEST_NAME);
  if (!manifestEntry) throw new Error("Backup ownership manifest is missing.");
  const manifest = JSON.parse(
    readEntryData(manifestEntry, 16 * 1024, "Backup ownership manifest").toString("utf8"),
  ) as Partial<BackupManifest>;
  if (manifest.formatVersion !== 1 || manifest.restaurantCode !== restaurantCode) {
    throw new Error("This backup belongs to a different restaurant.");
  }
  return manifest as BackupManifest;
}

function archiveRecoveryAssets(zip: AdmZip): RecoveryAsset[] {
  return zip.getEntries()
    .filter((entry) => !entry.isDirectory)
    .flatMap((entry) => {
      const fileName = path.basename(entry.entryName);
      if (
        entry.entryName.startsWith("images/menu/") &&
        /^(?:[a-f0-9-]+|library-[a-z0-9-]+)\.jpg$/i.test(fileName)
      ) {
        return [{
          entryName: `images/menu/${fileName}`,
          data: readEntryData(entry, MAX_MENU_IMAGE_BYTES, "Menu image"),
        }];
      }
      if (
        entry.entryName.startsWith("images/branding/") &&
        /^restaurant-logo\.(?:png|jpe?g|webp)$/i.test(fileName)
      ) {
        return [{
          entryName: `images/branding/${fileName}`,
          data: readEntryData(entry, MAX_BRANDING_IMAGE_BYTES, "Restaurant logo"),
        }];
      }
      return [];
    })
    .sort((left, right) => left.entryName.localeCompare(right.entryName));
}

function recoveryContentChecksum(db: Database.Database, assets: RecoveryAsset[]) {
  const hash = crypto.createHash("sha256");
  hash.update(`database:${logicalDatabaseChecksum(db)}\n`);
  for (const asset of assets) {
    hash.update(`asset:${asset.entryName}:${crypto.createHash("sha256").update(asset.data).digest("hex")}\n`);
  }
  return hash.digest("hex");
}

function restoreRestaurantAssets(zip: AdmZip, restaurantCode: string) {
  const entries = zip.getEntries().filter(
    (entry) => !entry.isDirectory && entry.entryName.startsWith("images/menu/"),
  );
  const imageDir = getMenuImageDir(restaurantCode);
  fs.rmSync(imageDir, { recursive: true, force: true });
  fs.mkdirSync(imageDir, { recursive: true });
  for (const entry of entries) {
    const fileName = path.basename(entry.entryName);
    if (/^(?:[a-f0-9-]+|library-[a-z0-9-]+)\.jpg$/i.test(fileName)) {
      fs.writeFileSync(
        path.join(imageDir, fileName),
        readEntryData(entry, MAX_MENU_IMAGE_BYTES, "Menu image"),
      );
    }
  }

  const brandingEntries = zip.getEntries().filter(
    (entry) => !entry.isDirectory && entry.entryName.startsWith("images/branding/"),
  );
  const brandingDir = getRestaurantBrandingDir(restaurantCode);
  fs.rmSync(brandingDir, { recursive: true, force: true });
  fs.mkdirSync(brandingDir, { recursive: true });
  for (const entry of brandingEntries) {
    const fileName = path.basename(entry.entryName);
    if (/^restaurant-logo\.(?:png|jpe?g|webp)$/i.test(fileName)) {
      fs.writeFileSync(
        path.join(brandingDir, fileName),
        readEntryData(entry, MAX_BRANDING_IMAGE_BYTES, "Restaurant logo"),
      );
    }
  }
}

function requireRestaurant() {
  const state = readActivationState();
  const deviceToken = readDeviceToken();
  if (state.status !== "approved" || !state.restaurant || !state.deviceId || !deviceToken) {
    throw new Error("POS is not activated.");
  }
  return {
    restaurant: state.restaurant,
    deviceId: state.deviceId,
    deviceToken,
  };
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function logicalDatabaseChecksum(db: Database.Database) {
  const hash = crypto.createHash("sha256");
  for (const table of BUSINESS_TABLES) {
    const exists = db.prepare(
      "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?",
    ).get(table);
    if (!exists) continue;
    const columns = db.prepare(`PRAGMA table_info("${table}")`).all() as Array<{
      name: string;
      pk: number;
    }>;
    const orderColumns = columns
      .filter((column) => column.pk > 0)
      .sort((left, right) => left.pk - right.pk)
      .map((column) => `"${column.name.replaceAll('"', '""')}"`);
    const orderBy = orderColumns.length ? orderColumns.join(", ") : "rowid";
    hash.update(`table:${table}\n`);
    for (const row of db.prepare(`SELECT * FROM "${table}" ORDER BY ${orderBy}`).iterate()) {
      hash.update(JSON.stringify(row));
      hash.update("\n");
    }
  }
  return hash.digest("hex");
}

function writeRestaurantArchive(
  restaurantCode: string,
  localPath: string,
  metadata: ReturnType<typeof databaseMetadata>,
) {
  const zip = new AdmZip();
  const manifest: BackupManifest = {
    formatVersion: 1,
    restaurantCode,
    createdAt: nowIso(),
    recoveryChecksum: metadata.databaseChecksum,
    checksumKind: "recovery_v1",
    syncSequence: metadata.syncSequence,
    schemaVersion: metadata.schemaVersion,
  };
  zip.addFile(BACKUP_MANIFEST_NAME, Buffer.from(JSON.stringify(manifest), "utf8"));
  zip.addLocalFile(getDatabasePath(restaurantCode), "", "restaurant.db");
  addRestaurantAssets(zip, localRecoveryAssets(restaurantCode));
  zip.writeZip(localPath);
}

function snapshotQueueRows(restaurantCode: string): SnapshotQueueItem[] {
  return withActivatedDatabase(restaurantCode, (db) =>
    (db.prepare("SELECT * FROM cloud_snapshot_queue ORDER BY created_at ASC LIMIT 10").all() as any[])
      .map((row) => ({
        id: row.id,
        snapshotType: row.snapshot_type,
        fileName: row.file_name,
        localPath: row.local_path,
        checksumSha256: row.checksum_sha256,
        databaseChecksum: row.database_checksum,
        checksumKind: row.checksum_kind,
        syncSequence: Number(row.sync_sequence),
        schemaVersion: Number(row.schema_version),
        sizeBytes: Number(row.size_bytes),
        attempts: Number(row.attempts),
        error: row.error || undefined,
        createdAt: row.created_at,
      })),
  );
}

function saveSnapshotQueueItem(restaurantCode: string, item: SnapshotQueueItem) {
  withActivatedDatabase(restaurantCode, (db) => {
    db.prepare(`
      INSERT OR REPLACE INTO cloud_snapshot_queue (
        id, snapshot_type, file_name, local_path, checksum_sha256,
        database_checksum, checksum_kind, sync_sequence, schema_version,
        size_bytes, attempts, error, created_at
      ) VALUES (
        @id, @snapshotType, @fileName, @localPath, @checksumSha256,
        @databaseChecksum, @checksumKind, @syncSequence, @schemaVersion,
        @sizeBytes, @attempts, @error, @createdAt
      )
    `).run({ ...item, error: item.error ?? null });
  });
}

function deleteSnapshotQueueItem(restaurantCode: string, id: string) {
  withActivatedDatabase(restaurantCode, (db) => {
    db.prepare("DELETE FROM cloud_snapshot_queue WHERE id = ?").run(id);
  });
}

function mapCloudSnapshot(row: any): CloudSnapshot {
  return {
    id: row.id,
    fileName: row.file_name,
    sizeBytes: Number(row.size_bytes),
    checksumSha256: row.checksum_sha256,
    databaseChecksum: row.database_checksum,
    checksumKind: row.checksum_kind || "file_sha256",
    syncSequence: Number(row.sync_sequence),
    schemaVersion: Number(row.schema_version),
    snapshotType: row.snapshot_type,
    status: row.status,
    verifiedAt: row.verified_at || undefined,
    createdAt: row.created_at,
    deviceId: row.device_id,
  };
}

function insertBackupLog(log: BackupLog) {
  withActivatedDatabase(log.restaurantCode, (db) => {
    db.prepare(`
      INSERT OR REPLACE INTO backup_logs (
        id, restaurant_code, device_id, type, status, file_name, local_path,
        size_bytes, created_at, uploaded_at, error
      ) VALUES (
        @id, @restaurantCode, @deviceId, @type, @status, @fileName, @localPath,
        @sizeBytes, @createdAt, @uploadedAt, @error
      )
    `).run({
      ...log,
      uploadedAt: log.uploadedAt ?? null,
      error: log.error ?? null,
    });
  });
}

function createRawEmergencyCopy(
  restaurantCode: string,
  deviceId: string,
): ApiResult<BackupLog> {
  try {
    try {
      forceCloseRestaurantDatabase(restaurantCode);
    } catch {
      // A corrupt database may not checkpoint cleanly; preserve the raw files anyway.
    }
    const databasePath = getDatabasePath(restaurantCode);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `emergency-raw-${stamp}.zip`;
    const localPath = path.join(getBackupDir(restaurantCode), fileName);
    const zip = new AdmZip();
    for (const suffix of ["", "-wal", "-shm"]) {
      const source = `${databasePath}${suffix}`;
      if (fs.existsSync(source)) zip.addLocalFile(source, "raw-database");
    }
    addRestaurantAssets(zip, localSafetyAssets(restaurantCode));
    zip.addFile(
      "RECOVERY-NOTE.txt",
      Buffer.from("Raw safety copy created because the current SQLite database could not be validated.", "utf8"),
    );
    zip.writeZip(localPath);
    const log: BackupLog = {
      id: crypto.randomUUID(),
      restaurantCode,
      deviceId,
      type: "emergency",
      status: "local_only",
      fileName,
      localPath,
      sizeBytes: fs.statSync(localPath).size,
      createdAt: nowIso(),
      error: "Raw safety copy of an invalid database; use only for technical recovery.",
    };
    try {
      insertBackupLog(log);
    } catch {
      // The raw copy remains useful even when the damaged database cannot store its log entry.
    }
    return { ok: true, data: log, message: "Raw emergency safety copy created locally." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create emergency safety copy.",
    };
  }
}

function rotateLocalBackups(restaurantCode: string, type: BackupType) {
  if (type === "manual" || type === "emergency") return;
  const keep = BACKUP_RETENTION.local[type];
  const dir = getBackupDir(restaurantCode);
  const files = fs
    .readdirSync(dir)
    .filter((file) => file.startsWith(`${type}-`) && file.endsWith(".zip"))
    .map((file) => ({ file, fullPath: path.join(dir, file), mtime: fs.statSync(path.join(dir, file)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  for (const stale of files.slice(keep)) {
    fs.rmSync(stale.fullPath, { force: true });
  }
}

function updateBackupLog(log: BackupLog) {
  insertBackupLog(log);
  return log;
}

async function uploadBackup(log: BackupLog, deviceToken: string): Promise<BackupLog> {
  if (!fs.existsSync(log.localPath)) {
    return updateBackupLog({ ...log, status: "failed", error: "Local backup file is missing." });
  }

  try {
    const form = new FormData();
    form.set("restaurant_code", log.restaurantCode);
    form.set("device_id", log.deviceId);
    form.set("device_token", deviceToken);
    form.set("backup_type", log.type);
    form.set("app_version", APP_VERSION);
    form.set(
      "file",
      new Blob([fs.readFileSync(log.localPath)], { type: "application/zip" }),
      log.fileName,
    );

    const response = await fetchWithTimeout(`${SUPABASE_FUNCTIONS_URL}/backup-upload`, {
      method: "POST",
      body: form,
    });
    const body = await response.json() as {
      error?: string;
      backup?: { uploaded_at?: string };
    };
    if (!response.ok) throw new Error(body.error || "Cloud backup upload failed.");

    return updateBackupLog({
      ...log,
      status: "uploaded",
      uploadedAt: body.backup?.uploaded_at || nowIso(),
      error: undefined,
    });
  } catch (error) {
    return updateBackupLog({
      ...log,
      status: "failed",
      error: error instanceof Error ? error.message : "Cloud backup upload failed.",
    });
  }
}

function pendingBackupLogs(restaurantCode: string): BackupLog[] {
  return withActivatedDatabase(restaurantCode, (db) =>
    db
      .prepare(`
        SELECT * FROM backup_logs
        WHERE status IN ('pending_upload', 'failed')
        ORDER BY created_at ASC
        LIMIT 10
      `)
      .all()
      .map((row: any) => ({
        id: row.id,
        restaurantCode: row.restaurant_code,
        deviceId: row.device_id,
        type: row.type,
        status: row.status,
        fileName: row.file_name,
        localPath: row.local_path,
        sizeBytes: Number(row.size_bytes),
        createdAt: row.created_at,
        uploadedAt: row.uploaded_at || undefined,
        error: row.error || undefined,
      })),
  );
}

export async function retryPendingBackups(): Promise<ApiResult<BackupLog[]>> {
  try {
    const { restaurant, deviceToken } = requireRestaurant();
    if (!restaurant.backupEnabled) return { ok: true, data: [] };
    const uploaded: BackupLog[] = [];
    for (const log of pendingBackupLogs(restaurant.restaurantCode)) {
      uploaded.push(await uploadBackup(log, deviceToken));
    }
    return { ok: true, data: uploaded };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Backup retry failed." };
  }
}

export function listBackupLogs(): ApiResult<BackupLog[]> {
  try {
    const { restaurant } = requireRestaurant();
    const logs = withActivatedDatabase(restaurant.restaurantCode, (db) =>
      db
        .prepare("SELECT * FROM backup_logs ORDER BY created_at DESC LIMIT 100")
        .all()
        .map((row: any) => ({
          id: row.id,
          restaurantCode: row.restaurant_code,
          deviceId: row.device_id,
          type: row.type,
          status: row.status,
          fileName: row.file_name,
          localPath: row.local_path,
          sizeBytes: Number(row.size_bytes),
          createdAt: row.created_at,
          uploadedAt: row.uploaded_at || undefined,
          error: row.error || undefined,
        })),
    );
    return { ok: true, data: logs };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to list backups" };
  }
}

export async function createBackupNow(type: BackupType = "manual"): Promise<ApiResult<BackupLog>> {
  try {
    const { restaurant, deviceId, deviceToken } = requireRestaurant();
    const restaurantCode = restaurant.restaurantCode;
    const dbPath = getDatabasePath(restaurantCode);
    if (!fs.existsSync(dbPath)) {
      throw new Error("Local database does not exist yet.");
    }

    const backupDir = getBackupDir(restaurantCode);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${type}-${stamp}.zip`;
    const localPath = path.join(backupDir, fileName);
    const metadata = databaseMetadata(restaurantCode);
    writeRestaurantArchive(restaurantCode, localPath, metadata);

    const sizeBytes = fs.statSync(localPath).size;
    const shouldUpload = restaurant.backupEnabled && type !== "emergency";
    const log: BackupLog = {
      id: crypto.randomUUID(),
      restaurantCode,
      deviceId,
      type,
      status: shouldUpload ? "pending_upload" : "local_only",
      fileName,
      localPath,
      sizeBytes,
      createdAt: nowIso(),
    };

    insertBackupLog(log);
    rotateLocalBackups(restaurantCode, type);
    if (!shouldUpload) {
      return {
        ok: true,
        data: log,
        message: type === "emergency"
          ? "Emergency backup created locally."
          : "Local backup created.",
      };
    }

    const uploaded = await uploadBackup(log, deviceToken);
    return uploaded.status === "uploaded"
      ? { ok: true, data: uploaded, message: "Backup created and uploaded." }
      : { ok: false, error: uploaded.error || "Backup created locally but cloud upload failed." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Backup failed" };
  }
}

export async function runBackupMaintenance() {
  const state = readActivationState();
  if (state.status !== "approved" || !state.restaurant?.backupEnabled || !readDeviceToken()) return;
  await retryPendingBackups();
  await retryPendingCloudSnapshots();
}

function sha256File(filePath: string) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function databaseMetadata(restaurantCode: string, allowDuringReplacement = false) {
  return withActivatedDatabase(restaurantCode, (db) => {
    db.pragma("wal_checkpoint(TRUNCATE)");
    const integrity = db.pragma("integrity_check", { simple: true });
    if (integrity !== "ok") throw new Error("Local database integrity check failed.");
    const foreignKeyIssues = db.pragma("foreign_key_check") as unknown[];
    if (foreignKeyIssues.length) throw new Error("Local database relationship check failed.");
    const schema = db.prepare("SELECT MAX(id) AS version FROM schema_migrations").get() as { version: number };
    const sequence = db.prepare("SELECT value FROM sync_state WHERE key = 'last_cloud_sequence'").get() as
      | { value: string }
      | undefined;
    return {
      schemaVersion: Number(schema.version || 0),
      syncSequence: Number(sequence?.value || 0),
      databaseChecksum: recoveryContentChecksum(db, localRecoveryAssets(restaurantCode)),
    };
  }, allowDuringReplacement);
}

async function syncAllPendingEvents() {
  for (let batch = 0; batch < 100; batch += 1) {
    const synced = await syncNow();
    if (!synced.ok) throw new Error(synced.error);
    if (synced.data.pendingEvents === 0) return synced.data;
  }
  throw new Error("Too many pending changes to finish this backup safely. Please retry after synchronization completes.");
}

async function uploadSnapshotQueueItem(
  item: SnapshotQueueItem,
  credentials: ReturnType<typeof requireRestaurant>,
): Promise<ApiResult<CloudSnapshot>> {
  const { restaurant, deviceId, deviceToken } = credentials;
  if (!fs.existsSync(item.localPath)) {
    const failed = { ...item, attempts: item.attempts + 1, error: "Queued snapshot file is missing." };
    saveSnapshotQueueItem(restaurant.restaurantCode, failed);
    return { ok: false, error: failed.error };
  }

  try {
    const form = new FormData();
    form.set("restaurant_code", restaurant.restaurantCode);
    form.set("device_id", deviceId);
    form.set("device_token", deviceToken);
    form.set("checksum_sha256", item.checksumSha256);
    form.set("database_checksum", item.databaseChecksum);
    form.set("checksum_kind", item.checksumKind);
    form.set("snapshot_type", item.snapshotType);
    form.set("sync_sequence", String(item.syncSequence));
    form.set("schema_version", String(item.schemaVersion));
    form.set(
      "file",
      new Blob([fs.readFileSync(item.localPath)], { type: "application/zip" }),
      item.fileName,
    );
    const response = await fetchWithTimeout(`${SUPABASE_FUNCTIONS_URL}/snapshot-upload`, {
      method: "POST",
      body: form,
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Snapshot upload failed.");
    deleteSnapshotQueueItem(restaurant.restaurantCode, item.id);
    fs.rmSync(item.localPath, { force: true });
    return {
      ok: true,
      data: mapCloudSnapshot(body.snapshot),
      message: body.skipped
        ? "No restaurant data changed since the latest verified snapshot."
        : "Cloud snapshot created and verified.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Snapshot upload failed.";
    saveSnapshotQueueItem(restaurant.restaurantCode, {
      ...item,
      attempts: item.attempts + 1,
      error: message,
    });
    return {
      ok: false,
      error: `Snapshot is safely queued on this computer and will retry automatically. ${message}`,
    };
  }
}

export async function retryPendingCloudSnapshots(): Promise<ApiResult<CloudSnapshot[]>> {
  try {
    const credentials = requireRestaurant();
    const results: CloudSnapshot[] = [];
    for (const item of snapshotQueueRows(credentials.restaurant.restaurantCode).slice(0, 3)) {
      const result = await uploadSnapshotQueueItem(item, credentials);
      if (!result.ok) return { ok: false, error: result.error };
      results.push(result.data);
    }
    return { ok: true, data: results };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Snapshot retry failed." };
  }
}

export async function pushCloudSnapshot(
  snapshotType: "manual" | "weekly" | "monthly" = "manual",
): Promise<ApiResult<CloudSnapshot>> {
  try {
    const credentials = requireRestaurant();
    const existingQueue = snapshotQueueRows(credentials.restaurant.restaurantCode);
    if (existingQueue.length) {
      const retried = await retryPendingCloudSnapshots();
      if (!retried.ok) return retried;
    }
    await syncAllPendingEvents();
    const { restaurant } = credentials;
    const metadata = databaseMetadata(restaurant.restaurantCode);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `snapshot-${stamp}.zip`;
    const localPath = path.join(getBackupDir(restaurant.restaurantCode), fileName);
    writeRestaurantArchive(restaurant.restaurantCode, localPath, metadata);
    const item: SnapshotQueueItem = {
      id: crypto.randomUUID(),
      snapshotType,
      fileName,
      localPath,
      checksumSha256: sha256File(localPath),
      databaseChecksum: metadata.databaseChecksum,
      checksumKind: "recovery_v1",
      syncSequence: metadata.syncSequence,
      schemaVersion: metadata.schemaVersion,
      sizeBytes: fs.statSync(localPath).size,
      attempts: 0,
      createdAt: nowIso(),
    };
    saveSnapshotQueueItem(restaurant.restaurantCode, item);
    return uploadSnapshotQueueItem(item, credentials);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Snapshot failed." };
  }
}

export async function listCloudSnapshots(): Promise<ApiResult<CloudSnapshot[]>> {
  try {
    const { restaurant, deviceId, deviceToken } = requireRestaurant();
    const response = await fetchWithTimeout(`${SUPABASE_FUNCTIONS_URL}/snapshot-list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantCode: restaurant.restaurantCode,
        deviceId,
        deviceToken,
      }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Failed to list cloud snapshots.");
    return {
      ok: true,
      data: body.snapshots.map(mapCloudSnapshot),
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to list snapshots." };
  }
}

export async function pullCloudSnapshot(snapshotId?: string): Promise<ApiResult<{ restored: true }>> {
  let tempPath = "";
  try {
    const { restaurant, deviceId, deviceToken } = requireRestaurant();
    if (!snapshotId) {
      const snapshots = await listCloudSnapshots();
      if (!snapshots.ok) throw new Error(snapshots.error);
      snapshotId = snapshots.data.find((snapshot) => snapshot.status === "verified")?.id;
      if (!snapshotId) throw new Error("No verified cloud snapshot is available.");
    }
    const code = restaurant.restaurantCode;
    const currentPath = getDatabasePath(code);
    const backupDir = getBackupDir(code);
    let currentDatabaseHealthy = true;
    try {
      databaseMetadata(code);
    } catch {
      currentDatabaseHealthy = false;
    }
    if (currentDatabaseHealthy) await syncAllPendingEvents();
    const supportedSchemaVersion = getLatestDatabaseSchemaVersion();
    const response = await fetchWithTimeout(`${SUPABASE_FUNCTIONS_URL}/snapshot-download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantCode: code,
        deviceId,
        deviceToken,
        snapshotId,
      }),
    });
    if (!response.ok) {
      const body = await response.json();
      throw new Error(body.error || "Snapshot download failed.");
    }
    const contentLength = Number(response.headers.get("Content-Length") || 0);
    if (contentLength > MAX_SNAPSHOT_BYTES) throw new Error("Cloud snapshot is too large to restore safely.");
    const metadataHeader = response.headers.get("X-Snapshot-Metadata");
    if (!metadataHeader) throw new Error("Cloud snapshot metadata is missing.");
    const metadata = JSON.parse(Buffer.from(metadataHeader, "base64").toString("utf8")) as {
      id: string;
      restaurantId?: string;
      restaurantCode: string;
      checksumSha256: string;
      databaseChecksum: string;
      checksumKind?: "recovery_v1" | "logical_v1" | "file_sha256";
      syncSequence: number;
      schemaVersion: number;
    };
    if (
      metadata.id !== snapshotId ||
      (metadata.restaurantId && metadata.restaurantId !== restaurant.restaurantId)
    ) {
      throw new Error("Cloud snapshot ownership validation failed.");
    }
    const archive = Buffer.from(await response.arrayBuffer());
    if (!archive.length || archive.length > MAX_SNAPSHOT_BYTES) {
      throw new Error("Cloud snapshot size is invalid.");
    }
    const checksum = crypto.createHash("sha256").update(archive).digest("hex");
    if (checksum !== metadata.checksumSha256) throw new Error("Snapshot checksum validation failed.");

    const zip = new AdmZip(archive);
    const manifest = validateArchiveOwnership(zip, code);
    const entry = zip.getEntry("restaurant.db");
    if (!entry) throw new Error("Cloud snapshot does not contain restaurant.db.");
    tempPath = path.join(backupDir, `restore-${crypto.randomUUID()}.db`);
    fs.writeFileSync(tempPath, readEntryData(entry, MAX_SNAPSHOT_BYTES, "Cloud snapshot database"));
    const candidate = new Database(tempPath, { readonly: true });
    let integrity: unknown;
    let foreignKeyIssues: unknown[] = [];
    let schema: { version: number };
    let candidateChecksum = "";
    try {
      integrity = candidate.pragma("integrity_check", { simple: true });
      foreignKeyIssues = candidate.pragma("foreign_key_check") as unknown[];
      schema = candidate.prepare("SELECT MAX(id) AS version FROM schema_migrations").get() as { version: number };
      candidateChecksum = metadata.checksumKind === "recovery_v1"
        ? recoveryContentChecksum(candidate, archiveRecoveryAssets(zip))
        : metadata.checksumKind === "logical_v1"
          ? logicalDatabaseChecksum(candidate)
          : sha256File(tempPath);
    } finally {
      candidate.close();
    }
    if (integrity !== "ok") throw new Error("Cloud snapshot database is corrupt.");
    if (foreignKeyIssues.length) throw new Error("Cloud snapshot has invalid database relationships.");
    if (candidateChecksum !== metadata.databaseChecksum) {
      throw new Error("Cloud snapshot database checksum validation failed.");
    }
    if (
      manifest.checksumKind !== "recovery_v1" ||
      manifest.recoveryChecksum !== metadata.databaseChecksum ||
      manifest.schemaVersion !== Number(metadata.schemaVersion) ||
      manifest.syncSequence !== Number(metadata.syncSequence)
    ) {
      throw new Error("Cloud snapshot manifest validation failed.");
    }
    if (Number(schema.version || 0) > supportedSchemaVersion) {
      throw new Error("Snapshot requires a newer POS version.");
    }

    const emergency = currentDatabaseHealthy
      ? await createBackupNow("emergency")
      : createRawEmergencyCopy(code, deviceId);
    if (!emergency.ok) throw new Error(emergency.error);
    const rollbackPath = `${currentPath}.restore-rollback`;
    let databaseReplaced = false;
    beginDatabaseReplacement(code);
    try {
      forceCloseRestaurantDatabase(code);
      fs.rmSync(rollbackPath, { force: true });
      fs.rmSync(`${currentPath}-wal`, { force: true });
      fs.rmSync(`${currentPath}-shm`, { force: true });
      fs.renameSync(currentPath, rollbackPath);
      fs.renameSync(tempPath, currentPath);
      tempPath = "";
      databaseReplaced = true;
      restoreRestaurantAssets(zip, code);
      await pullEventsAfter(Number(metadata.syncSequence || 0), true);
      databaseMetadata(code, true);
      fs.rmSync(rollbackPath, { force: true });
    } catch (restoreError) {
      forceCloseRestaurantDatabase(code);
      if (databaseReplaced && fs.existsSync(rollbackPath)) {
        fs.rmSync(currentPath, { force: true });
        fs.renameSync(rollbackPath, currentPath);
        restoreRestaurantAssets(new AdmZip(emergency.data.localPath), code);
      }
      throw restoreError;
    } finally {
      endDatabaseReplacement(code);
    }
    return { ok: true, data: { restored: true }, message: "Cloud data restored successfully." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Cloud restore failed." };
  } finally {
    if (tempPath) fs.rmSync(tempPath, { force: true });
  }
}

export async function runCloudSnapshotMaintenance() {
  const state = readActivationState();
  if (state.status !== "approved" || !state.restaurant?.backupEnabled) return;
  const code = state.restaurant.restaurantCode;
  const retried = await retryPendingCloudSnapshots();
  if (!retried.ok || snapshotQueueRows(code).length) return;
  const decision = withActivatedDatabase(code, (db) => {
    const rows = Object.fromEntries(
      (db.prepare("SELECT key, value FROM sync_state WHERE key IN ('last_snapshot_at','last_monthly_snapshot','last_cloud_sequence','snapshot_required')").all() as Array<{ key: string; value: string }>)
        .map((row) => [row.key, row.value]),
    );
    const now = new Date();
    const lastSnapshot = Date.parse(String(rows.last_snapshot_at || ""));
    const due = !Number.isFinite(lastSnapshot) || now.getTime() - lastSnapshot >= 7 * 24 * 60 * 60 * 1000;
    const month = now.toISOString().slice(0, 7);
    const hasMonthlyThisMonth = String(rows.last_monthly_snapshot || "").startsWith(month);
    const next = new Date(now);
    next.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
    next.setHours(2, 0, 0, 0);
    const save = db.prepare(`
      INSERT INTO sync_state (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);
    save.run("next_snapshot_at", next.toISOString(), now.toISOString());
    return {
      type: rows.snapshot_required === "1"
        ? "manual" as const
        : due
          ? (hasMonthlyThisMonth ? "weekly" as const : "monthly" as const)
          : null,
    };
  });
  if (!decision.type) return;
  const result = await pushCloudSnapshot(decision.type);
  if (!result.ok) return;
  withActivatedDatabase(code, (db) => {
    const save = db.prepare(`
      INSERT INTO sync_state (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);
    const now = new Date().toISOString();
    save.run("last_snapshot_at", now, now);
    save.run("snapshot_required", "0", now);
    if (decision.type === "monthly") save.run("last_monthly_snapshot", now, now);
  });
}

function dataCommandReceipt(restaurantCode: string, commandId: string) {
  return withActivatedDatabase(restaurantCode, (db) =>
    db.prepare("SELECT value FROM sync_state WHERE key = ?")
      .get(`data_command:${commandId}`) as { value: string } | undefined,
  )?.value;
}

function saveDataCommandReceipt(
  restaurantCode: string,
  commandId: string,
  action: "push_backup" | "restore_latest",
) {
  withActivatedDatabase(restaurantCode, (db) => {
    db.prepare(`
      INSERT INTO sync_state (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(`data_command:${commandId}`, action, nowIso());
  });
}

async function completeDataCommand(input: {
  restaurantCode: string;
  deviceId: string;
  deviceToken: string;
  commandId: string;
  success: boolean;
  message?: string;
  error?: string;
}) {
  let lastError = "Admin command completion failed.";
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetchWithTimeout(`${SUPABASE_FUNCTIONS_URL}/data-command-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || lastError);
      return true;
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  return false;
}

export async function processPendingDataCommand(): Promise<"restored" | "completed" | null> {
  const { restaurant, deviceId, deviceToken } = requireRestaurant();
  const response = await fetchWithTimeout(`${SUPABASE_FUNCTIONS_URL}/data-command-poll`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ restaurantCode: restaurant.restaurantCode, deviceId, deviceToken }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Failed to check Admin data commands.");
  if (!body.command) return null;
  const command = body.command as { id: string; action: "push_backup" | "restore_latest" };
  const previousReceipt = dataCommandReceipt(restaurant.restaurantCode, command.id);
  if (previousReceipt === command.action) {
    await completeDataCommand({
      restaurantCode: restaurant.restaurantCode,
      deviceId,
      deviceToken,
      commandId: command.id,
      success: true,
      message: command.action === "restore_latest"
        ? "Cloud data restored successfully."
        : "Cloud snapshot created and verified.",
    });
    return "completed";
  }

  const result = command.action === "push_backup" ? await pushCloudSnapshot("manual") : await pullCloudSnapshot();
  if (result.ok) saveDataCommandReceipt(restaurant.restaurantCode, command.id, command.action);
  await completeDataCommand({
    restaurantCode: restaurant.restaurantCode,
    deviceId,
    deviceToken,
    commandId: command.id,
    success: result.ok,
    message: result.ok ? result.message : undefined,
    error: result.ok ? undefined : result.error,
  });
  if (!result.ok) throw new Error(result.error);
  return command.action === "restore_latest" ? "restored" : "completed";
}

export async function restoreBackup(zipPath: string): Promise<ApiResult<BackupLog>> {
  let tempPath = "";
  try {
    const { restaurant, deviceId } = requireRestaurant();
    if (!fs.existsSync(zipPath)) throw new Error("Selected backup file does not exist.");
    if (fs.statSync(zipPath).size > MAX_SNAPSHOT_BYTES) {
      throw new Error("Selected backup is too large to restore safely.");
    }
    const zip = new AdmZip(zipPath);
    const manifest = validateArchiveOwnership(zip, restaurant.restaurantCode);
    const entry = zip.getEntry("restaurant.db");
    if (!entry) throw new Error("Backup ZIP does not contain restaurant.db");
    const code = restaurant.restaurantCode;
    const currentPath = getDatabasePath(code);
    const currentSchema = getLatestDatabaseSchemaVersion();
    tempPath = path.join(getBackupDir(code), `local-restore-${crypto.randomUUID()}.db`);
    fs.writeFileSync(tempPath, readEntryData(entry, MAX_SNAPSHOT_BYTES, "Backup database"));
    const candidate = new Database(tempPath, { readonly: true });
    let integrity: unknown;
    let foreignKeyIssues: unknown[] = [];
    let schemaVersion = 0;
    let recoveryChecksum = "";
    try {
      integrity = candidate.pragma("integrity_check", { simple: true });
      foreignKeyIssues = candidate.pragma("foreign_key_check") as unknown[];
      schemaVersion = Number(
        (candidate.prepare("SELECT MAX(id) AS version FROM schema_migrations").get() as { version: number }).version || 0,
      );
      recoveryChecksum = recoveryContentChecksum(candidate, archiveRecoveryAssets(zip));
    } finally {
      candidate.close();
    }
    if (integrity !== "ok") throw new Error("Selected backup database is corrupt.");
    if (foreignKeyIssues.length) throw new Error("Selected backup has invalid database relationships.");
    if (schemaVersion > currentSchema) throw new Error("Selected backup requires a newer POS version.");
    if (
      manifest.checksumKind !== "recovery_v1" ||
      manifest.schemaVersion !== schemaVersion ||
      manifest.recoveryChecksum !== recoveryChecksum
    ) {
      throw new Error("Selected backup content verification failed.");
    }

    let currentDatabaseHealthy = true;
    try {
      databaseMetadata(code);
    } catch {
      currentDatabaseHealthy = false;
    }
    const emergency = currentDatabaseHealthy
      ? await createBackupNow("emergency")
      : createRawEmergencyCopy(code, deviceId);
    if (!emergency.ok) return emergency;
    const rollbackPath = `${currentPath}.restore-rollback`;
    let databaseReplaced = false;
    beginDatabaseReplacement(code);
    try {
      forceCloseRestaurantDatabase(code);
      fs.rmSync(rollbackPath, { force: true });
      fs.rmSync(`${currentPath}-wal`, { force: true });
      fs.rmSync(`${currentPath}-shm`, { force: true });
      fs.renameSync(currentPath, rollbackPath);
      fs.renameSync(tempPath, currentPath);
      tempPath = "";
      databaseReplaced = true;
      restoreRestaurantAssets(zip, code);
      databaseMetadata(code, true);
      fs.rmSync(rollbackPath, { force: true });
    } catch (restoreError) {
      forceCloseRestaurantDatabase(code);
      if (databaseReplaced && fs.existsSync(rollbackPath)) {
        fs.rmSync(currentPath, { force: true });
        fs.renameSync(rollbackPath, currentPath);
        restoreRestaurantAssets(new AdmZip(emergency.data.localPath), code);
      }
      throw restoreError;
    } finally {
      endDatabaseReplacement(code);
    }
    return { ok: true, data: emergency.data, message: "Backup restored. Emergency backup was created first." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Restore failed" };
  } finally {
    if (tempPath) fs.rmSync(tempPath, { force: true });
  }
}

export function getBackupSummary() {
  const logs = listBackupLogs();
  const online = Boolean(getDeviceInfo().deviceId);
  return { logs, online };
}
