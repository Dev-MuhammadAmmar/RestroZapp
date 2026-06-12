import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  const supabase = adminClient();
  const version = await supabase
    .from("app_versions")
    .select("*")
    .eq("status", "published")
    .eq("is_latest", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (version.error) return jsonResponse({ error: version.error.message }, 500);
  if (!version.data) return jsonResponse({ version: "0.1.0", required: false, notes: "No published version yet." });

  return jsonResponse({
    version: version.data.version,
    downloadUrl: version.data.download_url,
    notes: version.data.notes,
    required: version.data.required,
  });
});
