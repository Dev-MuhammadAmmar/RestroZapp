import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticateDevice } from "../_shared/deviceAuth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const { restaurantCode, deviceId, deviceToken, afterSequence = 0 } = await req.json();
    const { supabase, restaurant } = await authenticateDevice({
      restaurantCode,
      deviceId,
      deviceToken,
    });
    const result = await supabase
      .from("restaurant_sync_events")
      .select("sequence,event_id,entity,entity_id,operation,payload,occurred_at")
      .eq("restaurant_id", restaurant.id)
      .gt("sequence", Number(afterSequence) || 0)
      .order("sequence", { ascending: true })
      .limit(1000);
    if (result.error) throw result.error;
    const events = result.data || [];
    return jsonResponse({
      ok: true,
      events,
      sequence: Number(events.at(-1)?.sequence || afterSequence || 0),
      hasMore: events.length === 1000,
    });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Sync pull failed" }, 403);
  }
});
