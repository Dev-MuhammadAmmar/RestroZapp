import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { sha256 } from "../_shared/hash.ts";
import { adminClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  const { restaurantCode, deviceId, deviceToken, appVersion } = await req.json();
  if (!restaurantCode || !deviceId || !deviceToken) {
    return jsonResponse({ error: "restaurantCode, deviceId, and deviceToken are required" }, 400);
  }
  const supabase = adminClient();

  const restaurant = await supabase.from("restaurants").select("id, restaurant_code").eq("restaurant_code", restaurantCode).single();
  if (restaurant.error || !restaurant.data) return jsonResponse({ error: "Restaurant not found" }, 404);

  const device = await supabase
    .from("restaurant_devices")
    .select("status, device_token_hash")
    .eq("restaurant_id", restaurant.data.id)
    .eq("device_id", deviceId)
    .single();

  if (device.error || !device.data) return jsonResponse({ error: "Device not found" }, 404);
  if (!device.data.device_token_hash || device.data.device_token_hash !== await sha256(String(deviceToken))) {
    return jsonResponse({ error: "Invalid device token" }, 401);
  }

  await supabase
    .from("restaurant_devices")
    .update({ app_version: appVersion, last_seen_at: new Date().toISOString() })
    .eq("restaurant_id", restaurant.data.id)
    .eq("device_id", deviceId);

  return jsonResponse({ status: device.data.status });
});
