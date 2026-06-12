import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { PosDatabase } from "../database/database";

const PASSWORD_KEY = "settingsPasswordHash";
const DEFAULT_PASSWORD = "admin123";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function matches(password: string, encoded: string) {
  const [algorithm, salt, expectedHex] = encoded.split(":");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function readSecret(db: PosDatabase) {
  return db.prepare("SELECT value FROM local_secrets WHERE key = ?").get(PASSWORD_KEY) as
    | { value: string }
    | undefined;
}

export function ensureSettingsPassword(db: PosDatabase) {
  if (readSecret(db)) return;
  const legacy = db.prepare("SELECT value FROM local_settings WHERE key = 'adminPassword'").get() as
    | { value: string }
    | undefined;
  const password = legacy?.value || DEFAULT_PASSWORD;
  db.prepare(`
    INSERT INTO local_secrets (key, value, updated_at)
    VALUES (?, ?, ?)
  `).run(PASSWORD_KEY, hashPassword(password), new Date().toISOString());
  db.prepare("DELETE FROM local_settings WHERE key = 'adminPassword'").run();
}

export function verifySettingsPassword(db: PosDatabase, password: string) {
  ensureSettingsPassword(db);
  const secret = readSecret(db);
  return Boolean(secret && matches(password, secret.value));
}

export function changeSettingsPassword(db: PosDatabase, currentPassword: string, newPassword: string) {
  if (!verifySettingsPassword(db, currentPassword)) throw new Error("Current password is incorrect.");
  if (newPassword.length < 6) throw new Error("New password must be at least 6 characters.");
  db.prepare(`
    INSERT INTO local_secrets (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(PASSWORD_KEY, hashPassword(newPassword), new Date().toISOString());
}
