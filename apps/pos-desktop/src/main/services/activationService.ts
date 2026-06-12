import {
  activationRequestSchema,
  type ActivationRequest,
  type ActivationState,
  type ApiResult,
  SUPABASE_FUNCTIONS_URL,
} from "@restrozapp/shared";
import { getDeviceInfo } from "./deviceService";
import {
  readActivationState,
  readDeviceToken,
  writeActivationState,
} from "./stateStore";

const apiBaseUrl = process.env.RESTROZAPP_API_BASE_URL || process.env.SUPABASE_FUNCTIONS_URL || SUPABASE_FUNCTIONS_URL;
const ACTIVATION_REQUEST_TIMEOUT_MS = 5_000;

async function postJson<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ACTIVATION_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await response.json();
    if (!response.ok) {
      return { ok: false, error: data.error || "Request failed", code: data.code };
    }
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error && error.name === "AbortError"
        ? "Activation check timed out"
        : "Unable to reach activation service",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function getActivationState(): ActivationState {
  return readActivationState();
}

export async function requestActivation(input: {
  restaurantCode: string;
  activationPassword: string;
}): Promise<ApiResult<ActivationState>> {
  const device = getDeviceInfo();
  const payload: ActivationRequest = activationRequestSchema.parse({
    ...input,
    ...device,
  });

  if (!apiBaseUrl) {
    return { ok: false, error: "Activation service is not configured." };
  }

  const result = await postJson<ActivationState>(`${apiBaseUrl}/activation-request`, payload);
  if (!result.ok) return result;
  return { ok: true, data: writeActivationState(result.data) };
}

export async function refreshActivationStatus(): Promise<ApiResult<ActivationState>> {
  const current = readActivationState();
  const device = getDeviceInfo();
  const deviceToken = readDeviceToken();

  if (!apiBaseUrl) {
    return { ok: false, error: "Activation service is not configured." };
  }

  const result = await postJson<ActivationState>(`${apiBaseUrl}/activation-status`, {
    restaurantCode: current.restaurant?.restaurantCode,
    deviceId: current.deviceId || device.deviceId,
    deviceToken,
    appVersion: device.appVersion,
  });

  if (result.ok) {
    const state = writeActivationState({ ...result.data, deviceToken });
    return { ok: true, data: state };
  }
  return result;
}
