import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { safeStorage } from "electron";
import { APP_VERSION, type DeviceInfo } from "@restrozapp/shared";
import { getInstallationIdentityPath } from "../config/paths";

function machineGuid() {
  if (process.platform !== "win32") return `${os.hostname()}|${os.platform()}|${os.arch()}`;
  try {
    const output = execFileSync(
      "reg.exe",
      ["query", "HKLM\\SOFTWARE\\Microsoft\\Cryptography", "/v", "MachineGuid"],
      { encoding: "utf8", windowsHide: true },
    );
    return output.trim().split(/\s+/).at(-1) || os.hostname();
  } catch {
    return `${os.hostname()}|${os.platform()}|${os.arch()}`;
  }
}

function installationId() {
  const filePath = getInstallationIdentityPath();
  if (fs.existsSync(filePath) && safeStorage.isEncryptionAvailable()) {
    try {
      return safeStorage.decryptString(fs.readFileSync(filePath));
    } catch {
      fs.rmSync(filePath, { force: true });
    }
  }
  if (!safeStorage.isEncryptionAvailable()) throw new Error("Secure device identity is unavailable.");
  const value = crypto.randomUUID();
  fs.writeFileSync(filePath, safeStorage.encryptString(value));
  return value;
}

export function getDeviceInfo(): DeviceInfo {
  const computerName = os.hostname() || "unknown-device";
  const osLabel = `${os.type()} ${os.release()} ${os.arch()}`;
  const raw = `${machineGuid()}|${installationId()}|com.restrozapp.pos`;
  return {
    deviceId: crypto.createHash("sha256").update(raw).digest("hex"),
    computerName,
    os: osLabel,
    appVersion: APP_VERSION,
  };
}
