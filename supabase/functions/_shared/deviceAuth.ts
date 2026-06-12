import { sha256 } from "./hash.ts";
import { adminClient } from "./supabase.ts";

const encoder = new TextEncoder();

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function ensureSigningKey() {
  const supabase = adminClient();
  const existing = await supabase
    .from("device_signing_keys")
    .select("private_jwk, public_jwk")
    .eq("id", "primary")
    .maybeSingle();
  if (existing.data) return existing.data;

  const pair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const privateJwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  const publicJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  const inserted = await supabase
    .from("device_signing_keys")
    .insert({ id: "primary", private_jwk: privateJwk, public_jwk: publicJwk })
    .select("private_jwk, public_jwk")
    .single();
  if (inserted.error) {
    const raced = await supabase
      .from("device_signing_keys")
      .select("private_jwk, public_jwk")
      .eq("id", "primary")
      .single();
    if (raced.error) throw raced.error;
    return raced.data;
  }
  return inserted.data;
}

export async function authenticateDevice(input: {
  restaurantCode: string;
  deviceId: string;
  deviceToken: string;
}) {
  const supabase = adminClient();
  const restaurant = await supabase
    .from("restaurants")
    .select("*, restaurant_configs(*)")
    .eq("restaurant_code", input.restaurantCode.toUpperCase())
    .single();
  if (restaurant.error || !restaurant.data) throw new Error("Restaurant not found");

  const device = await supabase
    .from("restaurant_devices")
    .select("*")
    .eq("restaurant_id", restaurant.data.id)
    .eq("device_id", input.deviceId)
    .single();
  if (
    device.error ||
    !device.data?.device_token_hash ||
    device.data.device_token_hash !== await sha256(input.deviceToken)
  ) {
    throw new Error("Invalid device credentials");
  }
  if (device.data.status !== "approved") throw new Error("Device is not approved");
  return { supabase, restaurant: restaurant.data, device: device.data };
}

export async function issueDeviceLease(input: {
  restaurantId: string;
  restaurantCode: string;
  deviceId: string;
  status: string;
  leaseVersion: number;
  configRevision: number;
}) {
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  const payload = {
    ...input,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  const payloadText = JSON.stringify(payload);
  const keys = await ensureSigningKey();
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    keys.private_jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    encoder.encode(payloadText),
  );
  return {
    payload,
    signature: base64Url(new Uint8Array(signature)),
    publicKey: keys.public_jwk,
  };
}
