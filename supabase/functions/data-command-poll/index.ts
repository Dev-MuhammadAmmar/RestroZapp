import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticateDevice } from "../_shared/deviceAuth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  try {
    const { restaurantCode, deviceId, deviceToken } = await req.json();
    const { supabase, restaurant } = await authenticateDevice({ restaurantCode, deviceId, deviceToken });
    const active = await supabase.from("restaurant_data_commands").select("*")
      .eq("restaurant_id", restaurant.id)
      .eq("status", "running")
      .eq("device_id", deviceId)
      .order("started_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (active.error) throw active.error;
    if (active.data) return jsonResponse({ ok: true, command: active.data });

    const staleBefore = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    await supabase.from("restaurant_data_commands")
      .update({ status: "pending", started_at: null, device_id: null })
      .eq("restaurant_id", restaurant.id)
      .eq("status", "running")
      .lt("started_at", staleBefore);
    const command = await supabase.from("restaurant_data_commands").select("*")
      .eq("restaurant_id", restaurant.id).eq("status", "pending")
      .order("requested_at", { ascending: true }).limit(1).maybeSingle();
    if (command.error) throw command.error;
    if (!command.data) return jsonResponse({ ok: true, command: null });
    const claimed = await supabase.from("restaurant_data_commands")
      .update({ status: "running", started_at: new Date().toISOString(), device_id: deviceId })
      .eq("id", command.data.id).eq("status", "pending").select().maybeSingle();
    return jsonResponse({ ok: true, command: claimed.data || null });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Command poll failed" }, 403);
  }
});
