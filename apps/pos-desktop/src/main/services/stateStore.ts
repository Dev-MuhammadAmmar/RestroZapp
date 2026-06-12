import crypto from "node:crypto";
import fs from "node:fs";
import { safeStorage } from "electron";
import {
  activationStateSchema,
  type ActivationState,
  type SignedDeviceLease,
} from "@restrozapp/shared";
import {
  ensureDir,
  getActivationCachePath,
  getDataRoot,
  getSecureCredentialsPath,
} from "../config/paths";

type SecureCredentials = {
  deviceToken?: string;
  lease?: SignedDeviceLease;
};

const defaultState: ActivationState = { status: "not_activated" };

function decodeBase64Url(value: string) {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function readEncrypted<T>(filePath: string): T | undefined {
  if (!fs.existsSync(filePath) || !safeStorage.isEncryptionAvailable()) return undefined;
  try {
    return JSON.parse(safeStorage.decryptString(fs.readFileSync(filePath))) as T;
  } catch {
    return undefined;
  }
}

function writeEncrypted(filePath: string, value: unknown) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Windows credential encryption is not available.");
  }
  ensureDir(getDataRoot());
  fs.writeFileSync(filePath, safeStorage.encryptString(JSON.stringify(value)));
}

function readCache(): ActivationState {
  try {
    if (!fs.existsSync(getActivationCachePath())) return defaultState;
    return activationStateSchema.parse(JSON.parse(fs.readFileSync(getActivationCachePath(), "utf8")));
  } catch {
    return defaultState;
  }
}

export function readSecureCredentials() {
  return readEncrypted<SecureCredentials>(getSecureCredentialsPath()) || {};
}

export function verifyLease(lease?: SignedDeviceLease) {
  if (!lease || lease.payload.status !== "approved") return false;
  if (Date.parse(lease.payload.expiresAt) <= Date.now()) return false;
  try {
    const verifier = crypto.createVerify("SHA256");
    verifier.update(JSON.stringify(lease.payload));
    verifier.end();
    const publicKey = crypto.createPublicKey({
      key: lease.publicKey as crypto.JsonWebKey,
      format: "jwk",
    });
    return verifier.verify(
      { key: publicKey, dsaEncoding: "ieee-p1363" },
      decodeBase64Url(lease.signature),
    );
  } catch {
    return false;
  }
}

export function readActivationState(): ActivationState {
  const cache = readCache();
  const credentials = readSecureCredentials();
  if (cache.status !== "approved") return cache;
  if (!verifyLease(credentials.lease)) {
    return {
      ...cache,
      status: "not_activated",
      message: "Device activation must be verified online.",
    };
  }
  return {
    ...cache,
    lease: credentials.lease,
    configRevision: credentials.lease?.payload.configRevision,
  };
}

export function readDeviceToken() {
  return readSecureCredentials().deviceToken;
}

export function writeActivationState(state: ActivationState) {
  const credentials: SecureCredentials = {
    deviceToken: state.deviceToken,
    lease: state.lease as SignedDeviceLease | undefined,
  };
  if (credentials.deviceToken || credentials.lease) {
    writeEncrypted(getSecureCredentialsPath(), credentials);
  }
  const publicState: ActivationState = {
    ...state,
    deviceToken: undefined,
    lease: undefined,
  };
  ensureDir(getDataRoot());
  fs.writeFileSync(getActivationCachePath(), JSON.stringify(publicState, null, 2));
  return readActivationState();
}
