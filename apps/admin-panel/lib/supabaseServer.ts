import { createClient } from "@supabase/supabase-js";

export function hasSupabaseAdminEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: async (input, init) => {
        const headers = new Headers(init?.headers);
        if (
          serviceRole.startsWith("sb_secret_")
          && headers.get("authorization") === `Bearer ${serviceRole}`
        ) {
          headers.delete("authorization");
        }
        return fetch(input, { ...init, headers });
      },
    },
  });
}
