import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticateDevice } from "../_shared/deviceAuth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  try {
    const { restaurantCode, deviceId, deviceToken, commandId, success, message, error } = await req.json();
    if (!commandId || typeof success !== "boolean") {
      return jsonResponse({ error: "commandId and success are required" }, 400);
    }
    const { supabase, restaurant } = await authenticateDevice({ restaurantCode, deviceId, deviceToken });
    const result = await supabase.from("restaurant_data_commands").update({
      status: success ? "completed" : "failed",
      completed_at: new Date().toISOString(),
      result_message: message || null,
      error: error || null,
    }).eq("id", commandId)
      .eq("restaurant_id", restaurant.id)
      .eq("device_id", deviceId)
      .eq("status", "running")
      .select("id")
      .maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) return jsonResponse({ error: "Running command was not found" }, 409);
    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Command completion failed" }, 403);
  }
});
