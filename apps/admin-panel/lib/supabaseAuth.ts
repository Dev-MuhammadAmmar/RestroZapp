import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseAuthClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Supabase Auth is not configured.");

  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (entries) => {
        try {
          entries.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server components cannot always write cookies; proxy refresh handles it.
        }
      },
    },
  });
}
