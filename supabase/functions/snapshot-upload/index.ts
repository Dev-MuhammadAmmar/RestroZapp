import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticateDevice } from "../_shared/deviceAuth.ts";

function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  try {
    const form = await req.formData();
    const restaurantCode = String(form.get("restaurant_code") || "").toUpperCase();
    const deviceId = String(form.get("device_id") || "");
    const deviceToken = String(form.get("device_token") || "");
    const checksum = String(form.get("checksum_sha256") || "");
    const databaseChecksum = String(form.get("database_checksum") || "");
    const checksumKind = String(form.get("checksum_kind") || "file_sha256");
    const snapshotType = String(form.get("snapshot_type") || "manual");
    const syncSequence = Number(form.get("sync_sequence") || 0);
    const schemaVersion = Number(form.get("schema_version") || 0);
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      !checksum ||
      !databaseChecksum ||
      !["recovery_v1", "logical_v1", "file_sha256"].includes(checksumKind) ||
      !["manual", "weekly", "monthly"].includes(snapshotType)
    ) {
      return jsonResponse({ error: "Invalid snapshot upload" }, 400);
    }
    const { supabase, restaurant } = await authenticateDevice({ restaurantCode, deviceId, deviceToken });
    const latest = await supabase.from("cloud_snapshots").select("*")
      .eq("restaurant_id", restaurant.id).eq("status", "verified")
      .eq("checksum_kind", checksumKind)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (latest.data?.database_checksum === databaseChecksum) {
      const verifiedAt = new Date().toISOString();
      const refreshed = await supabase.from("cloud_snapshots")
        .update({ verified_at: verifiedAt })
        .eq("id", latest.data.id)
        .select()
        .single();
      if (refreshed.error) throw refreshed.error;
      const backupLog = await supabase.from("backup_logs").upsert({
        id: latest.data.id,
        restaurant_id: restaurant.id,
        device_id: deviceId,
        restaurant_code: restaurantCode,
        type: latest.data.snapshot_type,
        status: "uploaded",
        file_name: latest.data.file_name,
        storage_path: latest.data.storage_path,
        size_bytes: latest.data.size_bytes,
        error: null,
        uploaded_at: verifiedAt,
      }, { onConflict: "id" });
      if (backupLog.error) throw backupLog.error;
      return jsonResponse({ ok: true, skipped: true, snapshot: refreshed.data });
    }

    const bytes = await file.arrayBuffer();
    const actualChecksum = hex(await crypto.subtle.digest("SHA-256", bytes));
    if (actualChecksum !== checksum) return jsonResponse({ error: "Uploaded snapshot checksum mismatch" }, 400);

    const storagePath = `snapshots/${restaurantCode}/${Date.now()}-${file.name}`;
    const upload = await supabase.storage.from("restaurant-backups").upload(storagePath, bytes, {
      contentType: "application/zip",
      upsert: false,
    });
    if (upload.error) throw upload.error;
    const inserted = await supabase.from("cloud_snapshots").insert({
      restaurant_id: restaurant.id,
      restaurant_code: restaurantCode,
      device_id: deviceId,
      storage_path: storagePath,
      file_name: file.name,
      size_bytes: file.size,
      checksum_sha256: checksum,
      database_checksum: databaseChecksum,
      checksum_kind: checksumKind,
      sync_sequence: syncSequence,
      schema_version: schemaVersion,
      snapshot_type: snapshotType,
      status: "verified",
      verified_at: new Date().toISOString(),
    }).select().single();
    if (inserted.error) {
      await supabase.storage.from("restaurant-backups").remove([storagePath]);
      throw inserted.error;
    }
    const backupLog = await supabase.from("backup_logs").upsert({
      id: inserted.data.id,
      restaurant_id: restaurant.id,
      device_id: deviceId,
      restaurant_code: restaurantCode,
      type: snapshotType,
      status: "uploaded",
      file_name: file.name,
      storage_path: storagePath,
      size_bytes: file.size,
      error: null,
      uploaded_at: new Date().toISOString(),
    }, { onConflict: "id" });
    if (backupLog.error) {
      await supabase.from("cloud_snapshots").delete().eq("id", inserted.data.id);
      await supabase.storage.from("restaurant-backups").remove([storagePath]);
      throw backupLog.error;
    }

    const all = await supabase.from("cloud_snapshots").select("id,storage_path,snapshot_type,created_at")
      .eq("restaurant_id", restaurant.id).eq("status", "verified")
      .order("created_at", { ascending: false });
    const limits: Record<string, number> = { weekly: 4, monthly: 6, manual: 3 };
    const seen: Record<string, number> = {};
    const stale = (all.data || []).filter((row) => {
      seen[row.snapshot_type] = (seen[row.snapshot_type] || 0) + 1;
      return seen[row.snapshot_type] > limits[row.snapshot_type];
    });
    if (stale.length) {
      await supabase.storage.from("restaurant-backups").remove(stale.map((row) => row.storage_path));
      await supabase.from("backup_logs").delete().in("id", stale.map((row) => row.id));
      await supabase.from("cloud_snapshots").delete().in("id", stale.map((row) => row.id));
    }

    const safetyCutoff = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("restaurant_sync_events").delete()
      .eq("restaurant_id", restaurant.id)
      .lte("sequence", syncSequence)
      .lt("received_at", safetyCutoff);

    return jsonResponse({ ok: true, skipped: false, snapshot: inserted.data });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Snapshot upload failed" }, 403);
  }
});
