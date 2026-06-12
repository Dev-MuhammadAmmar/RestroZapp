import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticateDevice } from "../_shared/deviceAuth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  try {
    const { restaurantCode, deviceId, deviceToken } = await req.json();
    const { supabase, restaurant } = await authenticateDevice({
      restaurantCode,
      deviceId,
      deviceToken,
    });
    const snapshots = await supabase
      .from("cloud_snapshots")
      .select("id,file_name,size_bytes,checksum_sha256,database_checksum,checksum_kind,sync_sequence,schema_version,snapshot_type,status,verified_at,created_at,device_id")
      .eq("restaurant_id", restaurant.id)
      .eq("status", "verified")
      .order("created_at", { ascending: false })
      .limit(50);
    if (snapshots.error) throw snapshots.error;
    return jsonResponse({ ok: true, snapshots: snapshots.data || [] });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Snapshot listing failed" }, 403);
  }
});
