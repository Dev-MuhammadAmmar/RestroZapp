import dns from "node:dns/promises";
import { APP_VERSION, type SystemStatus } from "@restrozapp/shared";
import { getDataRoot, getDatabasePath } from "../config/paths";
import { readActivationState } from "./stateStore";
import { getSyncStatus } from "./syncService";

export async function getSystemStatus(): Promise<SystemStatus> {
  let online = false;
  try {
    await dns.lookup("supabase.com");
    online = true;
  } catch {
    online = false;
  }

  const state = readActivationState();
  const restaurantCode = state.restaurant?.restaurantCode;
  return {
    online,
    appVersion: APP_VERSION,
    dataRoot: getDataRoot(),
    databasePath: restaurantCode ? getDatabasePath(restaurantCode) : undefined,
    restaurantCode,
    deviceId: state.deviceId,
    activationStatus: state.status,
    lastCheckedAt: state.lastCheckedAt,
    leaseExpiresAt: state.lease?.payload.expiresAt,
    sync: getSyncStatus(),
  };
}
