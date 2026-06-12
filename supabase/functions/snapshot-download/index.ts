import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticateDevice } from "../_shared/deviceAuth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  try {
    const { restaurantCode, deviceId, deviceToken, snapshotId } = await req.json();
    const { supabase, restaurant } = await authenticateDevice({
      restaurantCode,
      deviceId,
      deviceToken,
    });
    const snapshot = await supabase
      .from("cloud_snapshots")
      .select("*")
      .eq("id", snapshotId)
      .eq("restaurant_id", restaurant.id)
      .eq("status", "verified")
      .single();
    if (snapshot.error || !snapshot.data) return jsonResponse({ error: "Snapshot not found" }, 404);
    const download = await supabase.storage.from("restaurant-backups").download(snapshot.data.storage_path);
    if (download.error) throw download.error;
    return new Response(download.data, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${snapshot.data.file_name}"`,
        "X-Snapshot-Metadata": btoa(JSON.stringify({
          id: snapshot.data.id,
          restaurantCode: snapshot.data.restaurant_code,
          checksumSha256: snapshot.data.checksum_sha256,
          databaseChecksum: snapshot.data.database_checksum,
          checksumKind: snapshot.data.checksum_kind || "file_sha256",
          syncSequence: snapshot.data.sync_sequence,
          schemaVersion: snapshot.data.schema_version,
        })),
      },
    });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Snapshot download failed" }, 403);
  }
});
