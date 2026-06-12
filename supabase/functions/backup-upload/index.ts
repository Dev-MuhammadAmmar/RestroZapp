import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { sha256 } from "../_shared/hash.ts";
import { adminClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const form = await req.formData();
  const restaurantCode = String(form.get("restaurant_code") || "").toUpperCase();
  const deviceId = String(form.get("device_id") || "");
  const deviceToken = String(form.get("device_token") || "");
  const backupType = String(form.get("backup_type") || "manual");
  const appVersion = String(form.get("app_version") || "");
  const file = form.get("file");

  if (!restaurantCode || !deviceId || !deviceToken || !(file instanceof File)) {
    return jsonResponse({ error: "restaurant_code, device_id, device_token, and file are required" }, 400);
  }
  if (!["manual", "daily", "weekly", "monthly", "emergency"].includes(backupType)) {
    return jsonResponse({ error: "Invalid backup type" }, 400);
  }
  if (!file.name.toLowerCase().endsWith(".zip") || (file.type && file.type !== "application/zip")) {
    return jsonResponse({ error: "Only ZIP backups are accepted" }, 400);
  }

  const supabase = adminClient();
  const restaurant = await supabase.from("restaurants").select("id, backup_enabled").eq("restaurant_code", restaurantCode).single();
  if (restaurant.error || !restaurant.data) return jsonResponse({ error: "Restaurant not found" }, 404);
  if (!restaurant.data.backup_enabled) return jsonResponse({ error: "Backups are disabled for this restaurant" }, 403);

  const device = await supabase
    .from("restaurant_devices")
    .select("status, device_token_hash")
    .eq("restaurant_id", restaurant.data.id)
    .eq("device_id", deviceId)
    .single();

  if (
    device.error ||
    device.data?.status !== "approved" ||
    !device.data.device_token_hash ||
    device.data.device_token_hash !== await sha256(deviceToken)
  ) {
    return jsonResponse({ error: "Device is not approved" }, 403);
  }

  const storagePath = `backups/${restaurantCode}/${backupType}/${Date.now()}-${file.name}`;
  const upload = await supabase.storage.from("restaurant-backups").upload(storagePath, file, {
    contentType: "application/zip",
    upsert: false,
  });

  if (upload.error) return jsonResponse({ error: upload.error.message }, 500);

  const log = await supabase.from("backup_logs").insert({
    restaurant_id: restaurant.data.id,
    device_id: deviceId,
    restaurant_code: restaurantCode,
    type: backupType,
    status: "uploaded",
    file_name: file.name,
    storage_path: storagePath,
    size_bytes: file.size,
    app_version: appVersion,
    uploaded_at: new Date().toISOString(),
  }).select().single();

  if (log.error) {
    await supabase.storage.from("restaurant-backups").remove([storagePath]);
    return jsonResponse({ error: log.error.message }, 500);
  }
  return jsonResponse({ ok: true, backup: log.data });
});
