import { demoBackups, demoDevices, demoRestaurants, demoVersions } from "./demoData";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "./supabaseServer";

export async function getAdminSnapshot() {
  if (!hasSupabaseAdminEnv()) {
    if (process.env.NODE_ENV !== "development" || process.env.NEXT_PUBLIC_ENABLE_DEMO_ADMIN !== "true") {
      throw new Error("Supabase admin environment is not configured.");
    }
    return {
      mode: "demo",
      restaurants: demoRestaurants,
      devices: demoDevices,
      backups: demoBackups,
      versions: demoVersions,
      snapshots: [],
      checkpoints: [],
    };
  }

  const supabase = createSupabaseAdminClient();
  const [restaurants, devices, backups, versions, snapshots, checkpoints] = await Promise.all([
    supabase.from("restaurants").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("restaurant_devices").select("*, restaurants(restaurant_code)").order("requested_at", { ascending: false }).limit(50),
    supabase.from("backup_logs").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("app_versions").select("*").order("created_at", { ascending: false }).limit(10),
    supabase.from("cloud_snapshots").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("restaurant_sync_checkpoints").select("*").order("last_synced_at", { ascending: false }).limit(50),
  ]);
  const queryErrors = [restaurants.error, devices.error, backups.error, versions.error, snapshots.error, checkpoints.error].filter(Boolean);
  if (queryErrors.length) throw new Error(queryErrors.map((error) => error?.message).join("; "));

  return {
    mode: "supabase",
    restaurants: restaurants.data ?? [],
    devices: (devices.data ?? []).map((device: any) => ({
      ...device,
      restaurant_code: device.restaurants?.restaurant_code ?? "",
    })),
    backups: backups.data ?? [],
    versions: versions.data ?? [],
    snapshots: snapshots.data ?? [],
    checkpoints: checkpoints.data ?? [],
  };
}

export async function getRestaurantDetail(id: string) {
  if (!hasSupabaseAdminEnv()) {
    const snapshot = await getAdminSnapshot();
    const restaurant = snapshot.restaurants.find((entry: any) => entry.id === id) || snapshot.restaurants[0];
    return {
      mode: "demo",
      restaurant,
      config: { receipt_footer: "Thank You for Dining with Us!", backup_enabled: true, settings: {}, locked_setting_keys: [] },
      devices: snapshot.devices.filter((entry: any) => entry.restaurant_code === restaurant?.restaurant_code),
      backups: snapshot.backups.filter((entry: any) => entry.restaurant_code === restaurant?.restaurant_code),
      snapshots: [],
      checkpoints: [],
      commands: [],
      events: [],
    };
  }
  const supabase = createSupabaseAdminClient();
  const [restaurant, config, devices, backups, activationEvents, adminEvents, snapshots, checkpoints, commands] = await Promise.all([
    supabase.from("restaurants").select("*").eq("id", id).single(),
    supabase.from("restaurant_configs").select("*").eq("restaurant_id", id).maybeSingle(),
    supabase.from("restaurant_devices").select("*").eq("restaurant_id", id).order("requested_at", { ascending: false }),
    supabase.from("backup_logs").select("*").eq("restaurant_id", id).order("created_at", { ascending: false }).limit(25),
    supabase.from("activation_events").select("*").eq("restaurant_id", id).order("created_at", { ascending: false }).limit(25),
    supabase.from("admin_audit_logs").select("*").eq("restaurant_id", id).order("created_at", { ascending: false }).limit(25),
    supabase.from("cloud_snapshots").select("*").eq("restaurant_id", id).order("created_at", { ascending: false }).limit(25),
    supabase.from("restaurant_sync_checkpoints").select("*").eq("restaurant_id", id).order("last_synced_at", { ascending: false }),
    supabase.from("restaurant_data_commands").select("*").eq("restaurant_id", id).order("requested_at", { ascending: false }).limit(10),
  ]);
  if (restaurant.error) throw new Error(restaurant.error.message);
  const detailErrors = [config.error, devices.error, backups.error, activationEvents.error, adminEvents.error, snapshots.error, checkpoints.error, commands.error].filter(Boolean);
  if (detailErrors.length) throw new Error(detailErrors.map((error) => error?.message).join("; "));
  return {
    mode: "supabase",
    restaurant: restaurant.data,
    config: config.data,
    devices: devices.data || [],
    backups: backups.data || [],
    snapshots: snapshots.data || [],
    checkpoints: checkpoints.data || [],
    commands: commands.data || [],
    events: [...(activationEvents.data || []), ...(adminEvents.data || [])]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 25),
  };
}
