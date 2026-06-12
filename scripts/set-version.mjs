import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const version = process.argv[2]?.trim();
if (!version || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  throw new Error("Usage: npm run version:set -- 1.1.0");
}

const packageFiles = [
  "package.json",
  "apps/admin-panel/package.json",
  "apps/pos-desktop/package.json",
  "packages/shared/package.json",
];

for (const file of packageFiles) {
  const filePath = path.resolve(file);
  const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
  value.version = version;
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

const constantsPath = path.resolve("packages/shared/src/constants.ts");
const constants = fs.readFileSync(constantsPath, "utf8");
const updated = constants.replace(
  /export const APP_VERSION = "[^"]+";/,
  `export const APP_VERSION = "${version}";`,
);
if (updated === constants) throw new Error("APP_VERSION declaration was not found.");
fs.writeFileSync(constantsPath, updated);

console.log(`RestroZapp version updated to ${version}. Run npm install --package-lock-only next.`);
