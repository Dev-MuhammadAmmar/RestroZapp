import {
  APP_VERSION,
  SUPABASE_FUNCTIONS_URL,
  type ApiResult,
  type AppVersion,
} from "@restrozapp/shared";

export async function checkForUpdates(): Promise<ApiResult<AppVersion>> {
  const apiBaseUrl =
    process.env.RESTROZAPP_API_BASE_URL ||
    process.env.SUPABASE_FUNCTIONS_URL ||
    SUPABASE_FUNCTIONS_URL;

  const response = await fetch(`${apiBaseUrl}/version-check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentVersion: APP_VERSION }),
  });
  const data = await response.json();
  if (!response.ok) return { ok: false, error: data.error || "Version check failed" };
  return { ok: true, data };
}
