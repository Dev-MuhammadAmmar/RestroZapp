import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const EXPECTED_PROJECT_REF = "flrbzrgjsdrwbutkqxsp";
const OWNER_EMAIL = "ammarproduction56@gmail.com";
const ENV_FILE = path.resolve("apps/admin-panel/.env.local");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing ${filePath}`);
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

async function storageFiles(supabase, bucket, prefix = "") {
  const files = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: 1000,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) {
      if (/not found/i.test(error.message)) return files;
      throw error;
    }
    for (const item of data || []) {
      const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id) files.push(itemPath);
      else files.push(...await storageFiles(supabase, bucket, itemPath));
    }
    if (!data || data.length < 1000) break;
  }
  return files;
}

async function clearBucket(supabase, bucket) {
  const files = await storageFiles(supabase, bucket);
  for (let index = 0; index < files.length; index += 100) {
    const { error } = await supabase.storage.from(bucket).remove(files.slice(index, index + 100));
    if (error) throw error;
  }
  return files.length;
}

async function clearTable(supabase, table, key) {
  const { error } = await supabase.from(table).delete().not(key, "is", null);
  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) return "not deployed";
    throw error;
  }
  return "cleared";
}

async function countTable(supabase, table) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) return null;
    throw error;
  }
  return count || 0;
}

loadEnv(ENV_FILE);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRole) {
  throw new Error("Supabase URL or service-role key is missing from apps/admin-panel/.env.local");
}
if (new URL(url).hostname.split(".")[0] !== EXPECTED_PROJECT_REF) {
  throw new Error(`Refusing to reset unexpected Supabase project: ${url}`);
}
if (process.env.CONFIRM_SUPABASE_RESET !== "DELETE_RESTROZAPP_DATA") {
  throw new Error(
    "Set CONFIRM_SUPABASE_RESET=DELETE_RESTROZAPP_DATA to confirm the destructive reset.",
  );
}

const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const buckets = ["restaurant-backups", "restaurant-assets"];
const tables = [
  ["restaurant_data_commands", "id"],
  ["restaurant_sync_checkpoints", "restaurant_id"],
  ["restaurant_sync_events", "sequence"],
  ["cloud_snapshots", "id"],
  ["backup_logs", "id"],
  ["activation_events", "id"],
  ["admin_audit_logs", "id"],
  ["restaurant_devices", "id"],
  ["restaurant_configs", "id"],
  ["restaurant_activation_secrets", "id"],
  ["restaurants", "id"],
  ["support_tickets", "id"],
  ["app_versions", "id"],
];

console.log(`Resetting RestroZapp data in Supabase project ${EXPECTED_PROJECT_REF}...`);
for (const bucket of buckets) {
  console.log(`Storage ${bucket}: removed ${await clearBucket(supabase, bucket)} object(s)`);
}
for (const [table, key] of tables) {
  console.log(`${table}: ${await clearTable(supabase, table, key)}`);
}

const remaining = {};
for (const [table] of tables) remaining[table] = await countTable(supabase, table);
const nonEmpty = Object.entries(remaining).filter(([, count]) => count !== null && count !== 0);
if (nonEmpty.length) {
  throw new Error(`Reset verification failed: ${JSON.stringify(Object.fromEntries(nonEmpty))}`);
}

const { data: users, error: usersError } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});
if (usersError) throw usersError;
const owner = users.users.find(
  (user) => user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase(),
);
for (const user of users.users) {
  if (user.id === owner?.id) continue;
  const { error } = await supabase.auth.admin.deleteUser(user.id);
  if (error) throw error;
}
const ownerPreserved = Boolean(owner);

console.log(JSON.stringify({
  ok: true,
  projectRef: EXPECTED_PROJECT_REF,
  applicationRowsRemaining: 0,
  ownerAccountPreserved: ownerPreserved,
  preservedOwnerEmail: OWNER_EMAIL,
}, null, 2));
