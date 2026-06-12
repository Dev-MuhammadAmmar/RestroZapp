import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { sha256, randomToken } from "../_shared/hash.ts";
import { adminClient } from "../_shared/supabase.ts";
import { issueDeviceLease } from "../_shared/deviceAuth.ts";
import { resolveRestaurantLogo } from "../_shared/restaurantConfig.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const body = await req.json();
  const { restaurantCode, activationPassword, deviceId, computerName, os, appVersion } = body;
  if (!restaurantCode || !activationPassword || !deviceId || !computerName || !os || !appVersion) {
    return jsonResponse({ error: "Missing activation fields" }, 400);
  }

  const supabase = adminClient();
  const restaurant = await supabase
    .from("restaurants")
    .select("*, restaurant_configs(*)")
    .eq("restaurant_code", String(restaurantCode).toUpperCase())
    .single();

  if (restaurant.error || !restaurant.data) {
    return jsonResponse({ error: "Restaurant code not found" }, 404);
  }

  const secret = await supabase
    .from("restaurant_activation_secrets")
    .select("*")
    .eq("restaurant_id", restaurant.data.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const inputHash = await sha256(activationPassword);
  if (!secret.data || secret.data.secret_hash !== inputHash) {
    await supabase.from("activation_events").insert({
      restaurant_id: restaurant.data.id,
      restaurant_code: restaurant.data.restaurant_code,
      device_id: deviceId,
      event_type: "activation_failed",
      message: "Invalid activation password",
    });
    return jsonResponse({ error: "Invalid activation password" }, 401);
  }

  const existing = await supabase
    .from("restaurant_devices")
    .select("*")
    .eq("restaurant_id", restaurant.data.id)
    .eq("device_id", deviceId)
    .maybeSingle();

  let device = existing.data;
  const plainToken = randomToken();
  const deviceTokenHash = await sha256(plainToken);

  if (!device) {
    const inserted = await supabase
      .from("restaurant_devices")
      .insert({
        restaurant_id: restaurant.data.id,
        device_id: deviceId,
        device_token_hash: deviceTokenHash,
        computer_name: computerName,
        os,
        app_version: appVersion,
        status: "pending",
      })
      .select()
      .single();
    if (inserted.error) return jsonResponse({ error: inserted.error.message }, 500);
    device = inserted.data;
  } else {
    await supabase
      .from("restaurant_devices")
      .update({
        device_token_hash: deviceTokenHash,
        computer_name: computerName,
        os,
        app_version: appVersion,
        requested_at: new Date().toISOString(),
      })
      .eq("id", device.id);
  }

  await supabase.from("activation_events").insert({
    restaurant_id: restaurant.data.id,
    restaurant_code: restaurant.data.restaurant_code,
    device_id: deviceId,
    event_type: "activation_requested",
    message: `Device status is ${device.status}`,
  });

  const config = getConfig(restaurant.data);
  const lease = device.status === "approved"
    ? await issueDeviceLease({
        restaurantId: restaurant.data.id,
        restaurantCode: restaurant.data.restaurant_code,
        deviceId,
        status: device.status,
        leaseVersion: Number(device.lease_version || 1),
        configRevision: Number(config.config_revision || 1),
      })
    : undefined;

  return jsonResponse({
    status: device.status,
    deviceId,
    deviceToken: plainToken,
    restaurant: await toRestaurantConfig(supabase, restaurant.data),
    lease,
    configRevision: Number(config.config_revision || 1),
    lastCheckedAt: new Date().toISOString(),
    message: device.status === "approved"
      ? "Device approved."
      : "Activation request sent. Waiting for approval.",
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
