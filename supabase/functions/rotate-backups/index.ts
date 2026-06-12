import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabase.ts";

const keep: Record<string, number> = {
  daily: 3,
  weekly: 1,
  monthly: 1,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  const authorization = req.headers.get("Authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) return jsonResponse({ error: "Owner authentication is required" }, 401);

  const supabase = adminClient();
  const user = await supabase.auth.getUser(token);
  const role = user.data.user?.app_metadata?.role || user.data.user?.user_metadata?.role;
  if (user.error || !user.data.user || role !== "owner") {
    return jsonResponse({ error: "Owner access is required" }, 403);
  }

  const { restaurantCode, backupType } = await req.json();
  if (!restaurantCode || !backupType || !keep[backupType]) {
    return jsonResponse({ error: "restaurantCode and valid backupType are required" }, 400);
  }

  const prefix = `backups/${String(restaurantCode).toUpperCase()}/${backupType}`;
  const list = await supabase.storage.from("restaurant-backups").list(prefix, {
    sortBy: { column: "created_at", order: "desc" },
    limit: 100,
  });

  if (list.error) return jsonResponse({ error: list.error.message }, 500);

  const stale = (list.data || []).slice(keep[backupType]).map((file) => `${prefix}/${file.name}`);
  if (stale.length > 0) {
    const removed = await supabase.storage.from("restaurant-backups").remove(stale);
    if (removed.error) return jsonResponse({ error: removed.error.message }, 500);
  }

  return jsonResponse({ ok: true, removed: stale.length });
});
