export async function resolveRestaurantLogo(supabase: any, value: unknown) {
  const logo = typeof value === "string" ? value : "";
  if (!logo.startsWith("storage:")) return logo;
  const path = logo.slice("storage:".length);
  if (!path || path.includes("..")) return "";
  const signed = await supabase.storage.from("restaurant-assets").createSignedUrl(path, 7 * 24 * 60 * 60);
  return signed.data?.signedUrl || "";
}
