export type AdminActionStatus =
  | "idle"
  | "success"
  | "validation_error"
  | "unauthorized"
  | "unavailable"
  | "error";

export type AdminActionState = {
  status: AdminActionStatus;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialAdminActionState: AdminActionState = { status: "idle" };

export function isServiceUnavailable(error: unknown) {
  const message = error instanceof Error
    ? `${error.message} ${(error.cause as Error | undefined)?.message || ""}`
    : String(error || "");
  return /fetch failed|enotfound|econn|timeout|network|socket|dns/i.test(message);
}

export function unavailableActionState(): AdminActionState {
  return {
    status: "unavailable",
    message: "Cannot reach Supabase. Check your connection and retry.",
  };
}
