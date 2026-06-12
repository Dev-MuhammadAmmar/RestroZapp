import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { sha256 } from "../_shared/hash.ts";
import { adminClient } from "../_shared/supabase.ts";
import { issueDeviceLease } from "../_shared/deviceAuth.ts";
import { resolveRestaurantLogo } from "../_shared/restaurantConfig.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const { restaurantCode, deviceId, deviceToken, appVersion } = await req.json();
  if (!restaurantCode || !deviceId || !deviceToken) {
    return jsonResponse({ error: "restaurantCode, deviceId, and deviceToken are required" }, 400);
  }

  const supabase = adminClient();
  const restaurant = await supabase
    .from("restaurants")
    .select("*, restaurant_configs(*)")
    .eq("restaurant_code", String(restaurantCode).toUpperCase())
    .single();

  if (restaurant.error || !restaurant.data) return jsonResponse({ error: "Restaurant not found" }, 404);

  const device = await supabase
    .from("restaurant_devices")
    .select("*")
    .eq("restaurant_id", restaurant.data.id)
    .eq("device_id", deviceId)
    .maybeSingle();

  if (!device.data || !device.data.device_token_hash) return jsonResponse({ error: "Device not found" }, 404);
  if (device.data.device_token_hash !== await sha256(String(deviceToken))) {
    return jsonResponse({ error: "Invalid device token" }, 401);
  }

  await supabase
    .from("restaurant_devices")
    .update({ app_version: appVersion || device.data.app_version, last_seen_at: new Date().toISOString() })
    .eq("id", device.data.id);

  const config = getConfig(restaurant.data);
  const lease = device.data.status === "approved"
    ? await issueDeviceLease({
        restaurantId: restaurant.data.id,
        restaurantCode: restaurant.data.restaurant_code,
        deviceId,
        status: device.data.status,
        leaseVersion: Number(device.data.lease_version || 1),
        configRevision: Number(config.config_revision || 1),
      })
    : undefined;

  return jsonResponse({
    status: device.data.status,
    deviceId,
    deviceToken,
    restaurant: await toRestaurantConfig(supabase, restaurant.data),
    lease,
    configRevision: Number(config.config_revision || 1),
    lastCheckedAt: new Date().toISOString(),
    message:
      device.data.status === "approved"
        ? "Device approved."
        : device.data.status === "blocked"
          ? "Device blocked by admin."
          : "Still waiting for admin approval.",
  });
});

async function toRestaurantConfig(supabase: any, restaurant: any) {
  const config = getConfig(restaurant);
  const logoUrl = await resolveRestaurantLogo(supabase, restaurant.logo_url || config.settings?.restaurantLogo);
  const settings = {
    ...(config.settings || {}),
    restaurantLogo: logoUrl,
    restaurantName: restaurant.name,
    address: restaurant.address || "",
    phone1: restaurant.phone1 || "",
    phone2: restaurant.phone2 || "",
  };
  return {
    restaurantId: restaurant.id,
    restaurantCode: restaurant.restaurant_code,
    restaurantName: restaurant.name,
    address: restaurant.address || "",
    phone1: restaurant.phone1 || "",
    phone2: restaurant.phone2 || "",
    logoUrl,
    receiptFooter: config.receipt_footer || "Thank You for Dining with Us!",
    plan: restaurant.plan || "standard",
    backupEnabled: config.backup_enabled ?? restaurant.backup_enabled ?? true,
    operationalSettings: settings,
    lockedSettingKeys: config.locked_setting_keys || [],
    configRevision: Number(config.config_revision || 1),
  };
}

function getConfig(restaurant: any) {
  const relation = restaurant.restaurant_configs;
  return (Array.isArray(relation) ? relation[0] : relation) || {};
}
