import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticateDevice } from "../_shared/deviceAuth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const { restaurantCode, deviceId, deviceToken, events = [] } = body;
    if (!restaurantCode || !deviceId || !deviceToken || !Array.isArray(events)) {
      return jsonResponse({ error: "Invalid sync request" }, 400);
    }
    if (events.length > 500) return jsonResponse({ error: "Maximum 500 events per request" }, 400);

    const { supabase, restaurant } = await authenticateDevice({
      restaurantCode,
      deviceId,
      deviceToken,
    });

    const rows = events.map((event: any) => ({
      event_id: event.eventId,
      restaurant_id: restaurant.id,
      restaurant_code: restaurant.restaurant_code,
      device_id: deviceId,
      entity: String(event.entity),
      entity_id: String(event.entityId),
      operation: event.operation,
      payload: event.payload ?? null,
      occurred_at: event.occurredAt,
    }));
    if (rows.length) {
      const inserted = await supabase
        .from("restaurant_sync_events")
        .upsert(rows, { onConflict: "event_id", ignoreDuplicates: true });
      if (inserted.error) throw inserted.error;
    }

    const latest = await supabase
      .from("restaurant_sync_events")
      .select("sequence")
      .eq("restaurant_id", restaurant.id)
      .order("sequence", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sequence = Number(latest.data?.sequence || 0);
    await supabase.from("restaurant_sync_checkpoints").upsert({
      restaurant_id: restaurant.id,
      device_id: deviceId,
      last_pushed_sequence: sequence,
      last_synced_at: new Date().toISOString(),
    }, { onConflict: "restaurant_id,device_id" });

    return jsonResponse({ ok: true, acceptedEventIds: events.map((event: any) => event.eventId), sequence });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Sync failed" }, 403);
  }
});
