import { createSupabaseAuthClient } from "./supabaseAuth";
import { createSupabaseAdminClient } from "./supabaseServer";
import { isExplicitDemoMode, OWNER_EMAIL } from "./auth";

export async function requireOwnerApi() {
  if (isExplicitDemoMode()) {
    return { id: "development-owner", email: "development@restrozapp.local" };
  }
  const auth = await createSupabaseAuthClient();
  const { data, error } = await auth.auth.getUser();
  const role = data.user?.app_metadata?.role || data.user?.user_metadata?.role;
  if (
    error ||
    !data.user ||
    role !== "owner" ||
    data.user.email?.toLowerCase() !== OWNER_EMAIL
  ) throw new Error("UNAUTHORIZED");
  return data.user;
}

export async function auditAdminAction(input: {
  restaurantId?: string;
  restaurantCode?: string;
  eventType: string;
  message: string;
  metadata?: Record<string, unknown>;
}, authenticatedOwner?: { id: string; email?: string }) {
  const owner = authenticatedOwner || await requireOwnerApi();
  if (isExplicitDemoMode()) return owner;
  const admin = createSupabaseAdminClient();
  await admin.from("admin_audit_logs").insert({
    owner_user_id: owner.id,
    owner_email: owner.email,
    restaurant_id: input.restaurantId || null,
    restaurant_code: input.restaurantCode || "",
    event_type: input.eventType,
    message: input.message,
    metadata: input.metadata || {},
  });
  return owner;
}
