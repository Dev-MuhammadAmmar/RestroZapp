import { redirect } from "next/navigation";
import { createSupabaseAuthClient } from "./supabaseAuth";

export const OWNER_EMAIL = "ammarproduction56@gmail.com";

export function isExplicitDemoMode() {
  return process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_ENABLE_DEMO_ADMIN === "true";
}

export async function requireOwner() {
  if (isExplicitDemoMode()) {
    return { id: "development-owner", email: "development@restrozapp.local" };
  }
  const supabase = await createSupabaseAuthClient();
  let data;
  let error;
  try {
    const result = await supabase.auth.getUser();
    data = result.data;
    error = result.error;
  } catch {
    redirect("/admin/login?error=supabase_unavailable");
  }
  if (error || !data.user) redirect("/admin/login");
  const role = data.user.app_metadata?.role || data.user.user_metadata?.role;
  if (role !== "owner" || data.user.email?.toLowerCase() !== OWNER_EMAIL) {
    redirect("/admin/login?error=owner_access_required");
  }
  return data.user;
}
