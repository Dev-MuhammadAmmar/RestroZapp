import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const version = process.argv[2]?.trim();
const downloadUrl = process.argv[3]?.trim();
const notes = process.argv.slice(4).join(" ").trim() || `RestroZapp POS ${version}`;
if (!version || !downloadUrl) {
  throw new Error(
    "Usage: npm run release:publish-record -- 1.1.0 https://github.com/.../RestroZapp-POS-Setup.exe \"Release notes\"",
  );
}
if (new URL(downloadUrl).protocol !== "https:") {
  throw new Error("The release download URL must use HTTPS.");
}

const envPath = path.resolve("apps/admin-panel/.env.local");
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRole) {
  throw new Error("Supabase credentials are missing from apps/admin-panel/.env.local");
}

const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const cleared = await supabase.from("app_versions").update({ is_latest: false }).neq("version", "");
if (cleared.error) throw cleared.error;
const result = await supabase.from("app_versions").upsert({
  version,
  download_url: downloadUrl,
  notes,
  required: false,
  is_latest: true,
  status: "published",
}, { onConflict: "version" });
if (result.error) throw result.error;

console.log(`Published RestroZapp ${version} as the latest website download.`);
