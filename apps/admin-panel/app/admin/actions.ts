"use server";

import crypto from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AdminActionState } from "@/lib/actionState";
import { isServiceUnavailable, unavailableActionState } from "@/lib/actionState";
import { auditAdminAction, requireOwnerApi } from "@/lib/adminMutations";
import { isExplicitDemoMode, OWNER_EMAIL } from "@/lib/auth";
import { requestAddressFromHeaders, takeRateLimit } from "@/lib/rateLimit";
import { createSupabaseAuthClient } from "@/lib/supabaseAuth";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabaseServer";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required.").max(200),
});
const restaurantSchema = z.object({
  name: z.string().trim().min(1, "Restaurant name is required.").max(120),
  restaurantCode: z.string().trim().min(2, "Restaurant code is required.").max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Use only letters, numbers, hyphens, and underscores."),
  activationPassword: z.string().min(6, "Activation password must be at least 6 characters.").max(200),
  phone1: z.string().trim().max(40),
  address: z.string().trim().max(500),
});
const profileSchema = z.object({
  name: z.string().trim().min(1, "Restaurant name is required.").max(120),
  status: z.enum(["active", "trial", "suspended"]),
  plan: z.string().trim().min(1).max(60),
  phone1: z.string().trim().max(40),
  address: z.string().trim().max(500),
});
const deviceSchema = z.object({ deviceId: z.string().uuid("Invalid device identifier.") });
const dataCommandSchema = z.object({ action: z.enum(["push_backup", "restore_latest"]) });
const supportSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  ownerNote: z.string().trim().max(2000),
});
const versionSchema = z.object({
  version: z.string().trim().min(1, "Version is required.").max(40),
  status: z.enum(["draft", "published"]),
  downloadUrl: z.string().trim().url("Enter a valid download URL.").refine(
    (value) => value.startsWith("https://"),
    "Download URL must use HTTPS.",
  ),
  notes: z.string().trim().min(1, "Release notes are required.").max(10000),
});

function values(formData: FormData) {
  return Object.fromEntries(formData);
}

function validationState(error: z.ZodError): AdminActionState {
  const flattened = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  const fieldErrors = Object.fromEntries(
    Object.entries(flattened)
      .filter(([, messages]) => Boolean(messages?.length))
      .map(([field, messages]) => [field, messages || []]),
  );
  return {
    status: "validation_error",
    message: "Check the highlighted information and try again.",
    fieldErrors,
  };
}

function actionError(error: unknown): AdminActionState {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return { status: "unauthorized", message: "Your owner session has expired. Sign in again." };
  }
  if (isServiceUnavailable(error)) return unavailableActionState();
  console.error("Admin action failed", error);
  return { status: "error", message: "The operation could not be completed. Please retry." };
}

function databaseError(message: string): AdminActionState {
  if (/does not exist|schema cache|could not find the table/i.test(message)) {
    return {
      status: "error",
      message: "The required Supabase migration has not been applied yet.",
    };
  }
  return { status: "error", message };
}

export async function loginAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = loginSchema.safeParse(values(formData));
  if (!parsed.success) return validationState(parsed.error);
  const address = requestAddressFromHeaders(await headers());
  if (!takeRateLimit(`owner-login:${address}`, 8, 15 * 60 * 1000)) {
    return { status: "error", message: "Too many login attempts. Try again later." };
  }
  if (isExplicitDemoMode()) redirect("/admin/overview");

  try {
    const supabase = await createSupabaseAuthClient();
    const result = await supabase.auth.signInWithPassword(parsed.data);
    if (result.error) {
      return {
        status: "error",
        message: /invalid login credentials/i.test(result.error.message)
          ? "Incorrect email or password."
          : result.error.message,
      };
    }
    const role = result.data.user.app_metadata?.role || result.data.user.user_metadata?.role;
    if (role !== "owner" || result.data.user.email?.toLowerCase() !== OWNER_EMAIL) {
      await supabase.auth.signOut();
      return { status: "unauthorized", message: "This account does not have owner access." };
    }
  } catch (error) {
    return actionError(error);
  }
  redirect("/admin/overview");
}

export async function logoutAction() {
  if (!isExplicitDemoMode()) {
    try {
      const supabase = await createSupabaseAuthClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Owner logout failed", error);
    }
  }
  redirect("/admin/login");
}

export async function createRestaurantAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = restaurantSchema.safeParse(values(formData));
  if (!parsed.success) return validationState(parsed.error);
  let createdId = "";
  try {
    const owner = await requireOwnerApi();
    if (!hasSupabaseAdminEnv()) {
      return { status: "unavailable", message: "Supabase server credentials are not configured." };
    }
    const admin = createSupabaseAdminClient();
    const restaurantCode = parsed.data.restaurantCode.toUpperCase();
    const restaurant = await admin.from("restaurants").insert({
      restaurant_code: restaurantCode,
      name: parsed.data.name,
      address: parsed.data.address,
      phone1: parsed.data.phone1,
      status: "active",
      plan: "standard",
      backup_enabled: true,
    }).select().single();
    if (restaurant.error) return databaseError(restaurant.error.message);
    createdId = restaurant.data.id;

    const secret = await admin.from("restaurant_activation_secrets").insert({
      restaurant_id: createdId,
      secret_hash: crypto.createHash("sha256").update(parsed.data.activationPassword).digest("hex"),
      is_active: true,
    });
    if (secret.error) {
      await admin.from("restaurants").delete().eq("id", createdId);
      return databaseError(secret.error.message);
    }
    const config = await admin.from("restaurant_configs").insert({
      restaurant_id: createdId,
      receipt_footer: "Thank You for Dining with Us!",
      backup_enabled: true,
    });
    if (config.error) return databaseError(config.error.message);
    await auditAdminAction({
      restaurantId: createdId,
      restaurantCode,
      eventType: "restaurant_created",
      message: `Created restaurant ${parsed.data.name}`,
    }, owner);
  } catch (error) {
    return actionError(error);
  }
  redirect(`/admin/restaurants/${createdId}`);
}

export async function updateRestaurantAction(
  restaurantId: string,
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = profileSchema.safeParse(values(formData));
  if (!parsed.success) return validationState(parsed.error);
  try {
    const owner = await requireOwnerApi();
    const result = await createSupabaseAdminClient().from("restaurants").update({
      ...parsed.data,
      updated_at: new Date().toISOString(),
    }).eq("id", restaurantId).select("restaurant_code").single();
    if (result.error) return databaseError(result.error.message);
    await auditAdminAction({
      restaurantId,
      restaurantCode: result.data.restaurant_code,
      eventType: "restaurant_updated",
      message: `Updated ${parsed.data.name}`,
    }, owner);
    revalidatePath(`/admin/restaurants/${restaurantId}`);
    revalidatePath("/admin/restaurants");
    return { status: "success", message: "Restaurant profile updated." };
  } catch (error) {
    return actionError(error);
  }
}

export async function rotateActivationSecretAction(
  restaurantId: string,
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = z.object({
    activationPassword: z.string().min(6, "Password must be at least 6 characters.").max(200),
  }).safeParse(values(formData));
  if (!parsed.success) return validationState(parsed.error);
  try {
    const owner = await requireOwnerApi();
    const admin = createSupabaseAdminClient();
    const disabled = await admin.from("restaurant_activation_secrets")
      .update({ is_active: false }).eq("restaurant_id", restaurantId);
    if (disabled.error) return databaseError(disabled.error.message);
    const result = await admin.from("restaurant_activation_secrets").insert({
      restaurant_id: restaurantId,
      secret_hash: crypto.createHash("sha256").update(parsed.data.activationPassword).digest("hex"),
      is_active: true,
    });
    if (result.error) return databaseError(result.error.message);
    await auditAdminAction({
      restaurantId,
      eventType: "activation_secret_rotated",
      message: "Rotated activation password",
    }, owner);
    revalidatePath(`/admin/restaurants/${restaurantId}`);
    return { status: "success", message: "Activation password rotated." };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateRestaurantConfigAction(
  restaurantId: string,
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const receiptWidth = String(formData.get("receiptWidth") || "66mm");
  const defaultPaymentMethod = String(formData.get("defaultPaymentMethod") || "cash");
  if (!["58mm", "66mm", "80mm"].includes(receiptWidth)) {
    return { status: "validation_error", message: "Invalid receipt width." };
  }
  if (!["cash", "card", "online", "other"].includes(defaultPaymentMethod)) {
    return { status: "validation_error", message: "Invalid payment method." };
  }
  try {
    const owner = await requireOwnerApi();
    const admin = createSupabaseAdminClient();
    const settings = {
      restaurantName: String(formData.get("restaurantName") || "").trim(),
      restaurantLogo: String(formData.get("restaurantLogo") || "").trim(),
      address: String(formData.get("address") || "").trim(),
      phone1: String(formData.get("phone1") || "").trim(),
      phone2: String(formData.get("phone2") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      footerMessage: String(formData.get("footerMessage") || ""),
      halls: [...new Set(String(formData.get("halls") || "").split(/\r?\n|,/)
        .map((hall) => hall.trim()).filter(Boolean))].slice(0, 20),
      taxPercentage: Number(formData.get("taxPercentage") || 0),
      deliveryCharges: Number(formData.get("deliveryCharges") || 0),
      receiptWidth,
      defaultPaymentMethod,
      printerName: String(formData.get("printerName") || "").trim(),
      quickPrintEnabled: formData.get("quickPrintEnabled") === "on",
      printCustomerTicket: formData.get("printCustomerTicket") === "on",
      splitKOTByKitchen: formData.get("splitKOTByKitchen") === "on",
    };
    if (!settings.restaurantName || !Number.isFinite(settings.taxPercentage)
      || settings.taxPercentage < 0 || settings.taxPercentage > 100
      || !Number.isFinite(settings.deliveryCharges) || settings.deliveryCharges < 0) {
      return { status: "validation_error", message: "Review the restaurant name and billing values." };
    }
    const logoFile = formData.get("logoFile");
    if (logoFile instanceof File && logoFile.size > 0) {
      if (logoFile.size > 2 * 1024 * 1024
        || !["image/png", "image/jpeg", "image/webp"].includes(logoFile.type)) {
        return { status: "validation_error", message: "Logo must be PNG, JPEG, or WebP up to 2 MB." };
      }
      const bytes = Buffer.from(await logoFile.arrayBuffer());
      const validMagic =
        (logoFile.type === "image/png" && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
        || (logoFile.type === "image/jpeg" && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
        || (logoFile.type === "image/webp" && bytes.subarray(0, 4).toString("ascii") === "RIFF"
          && bytes.subarray(8, 12).toString("ascii") === "WEBP");
      if (!validMagic) return { status: "validation_error", message: "The uploaded logo content is invalid." };
      const extension = logoFile.type === "image/png" ? "png" : logoFile.type === "image/webp" ? "webp" : "jpg";
      const storagePath = `${restaurantId}/restaurant-logo.${extension}`;
      const upload = await admin.storage.from("restaurant-assets").upload(storagePath, bytes, {
        contentType: logoFile.type,
        upsert: true,
        cacheControl: "3600",
      });
      if (upload.error) return databaseError(upload.error.message);
      settings.restaurantLogo = `storage:${storagePath}`;
    } else if (settings.restaurantLogo && !settings.restaurantLogo.startsWith("storage:")) {
      try {
        if (new URL(settings.restaurantLogo).protocol !== "https:") throw new Error();
      } catch {
        return { status: "validation_error", message: "Logo must be an uploaded file or valid HTTPS URL." };
      }
    }
    const lockedKeys = formData.getAll("lockedKeys").map(String);
    const result = await admin.from("restaurant_configs").upsert({
      restaurant_id: restaurantId,
      receipt_footer: settings.footerMessage,
      backup_enabled: formData.get("backupEnabled") === "on",
      settings,
      locked_setting_keys: lockedKeys,
      updated_at: new Date().toISOString(),
    }, { onConflict: "restaurant_id" });
    if (result.error) return databaseError(result.error.message);
    const profile = await admin.from("restaurants").update({
      name: settings.restaurantName,
      address: settings.address,
      phone1: settings.phone1,
      phone2: settings.phone2,
      logo_url: settings.restaurantLogo,
    }).eq("id", restaurantId);
    if (profile.error) return databaseError(profile.error.message);
    await auditAdminAction({
      restaurantId,
      eventType: "restaurant_config_updated",
      message: "Updated cloud configuration",
      metadata: { lockedKeys },
    }, owner);
    revalidatePath(`/admin/restaurants/${restaurantId}`);
    return { status: "success", message: "Cloud configuration updated." };
  } catch (error) {
    return actionError(error);
  }
}

async function updateDevice(
  operation: "approve" | "block" | "unblock",
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = deviceSchema.safeParse(values(formData));
  if (!parsed.success) return validationState(parsed.error);
  try {
    const owner = await requireOwnerApi();
    const admin = createSupabaseAdminClient();
    const result = operation === "approve"
      ? await admin.rpc("approve_restaurant_device", { target_device: parsed.data.deviceId })
      : operation === "block"
        ? await admin.rpc("block_restaurant_device", { target_device: parsed.data.deviceId })
        : await admin.from("restaurant_devices").update({ status: "pending", blocked_at: null })
          .eq("id", parsed.data.deviceId);
    if (result.error) return databaseError(result.error.message);
    const eventType = operation === "approve"
      ? "device_approved"
      : operation === "block"
        ? "device_blocked"
        : "device_unblocked";
    await auditAdminAction({
      eventType,
      message: operation === "unblock"
        ? `Unblocked device ${parsed.data.deviceId}; approval is required before billing`
        : `${operation === "approve" ? "Approved" : "Blocked"} device ${parsed.data.deviceId}`,
      metadata: { deviceId: parsed.data.deviceId },
    }, owner);
    revalidatePath("/admin/devices");
    return {
      status: "success",
      message: operation === "unblock" ? "Device returned to pending approval." : `Device ${operation}d.`,
    };
  } catch (error) {
    return actionError(error);
  }
}

export const approveDeviceAction = updateDevice.bind(null, "approve");
export const blockDeviceAction = updateDevice.bind(null, "block");
export const unblockDeviceAction = updateDevice.bind(null, "unblock");

export async function requestDataCommandAction(
  restaurantId: string,
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = dataCommandSchema.safeParse(values(formData));
  if (!parsed.success) return validationState(parsed.error);
  try {
    const owner = await requireOwnerApi();
    const admin = createSupabaseAdminClient();
    const restaurant = await admin.from("restaurants").select("restaurant_code")
      .eq("id", restaurantId).single();
    if (restaurant.error) return databaseError(restaurant.error.message);
    const existing = await admin.from("restaurant_data_commands").select("id")
      .eq("restaurant_id", restaurantId).eq("action", parsed.data.action)
      .in("status", ["pending", "running"]).limit(1).maybeSingle();
    if (existing.error) return databaseError(existing.error.message);
    if (existing.data) return { status: "success", message: "This command is already pending." };
    const inserted = await admin.from("restaurant_data_commands").insert({
      restaurant_id: restaurantId,
      restaurant_code: restaurant.data.restaurant_code,
      action: parsed.data.action,
      requested_by: owner.id,
      requested_by_email: owner.email,
    });
    if (inserted.error?.code === "23505") {
      return { status: "success", message: "This command is already pending." };
    }
    if (inserted.error) return databaseError(inserted.error.message);
    await auditAdminAction({
      restaurantId,
      restaurantCode: restaurant.data.restaurant_code,
      eventType: `data_command_${parsed.data.action}`,
      message: `Requested ${parsed.data.action.replace("_", " ")}`,
    }, owner);
    revalidatePath(`/admin/restaurants/${restaurantId}`);
    revalidatePath("/admin/backups");
    return { status: "success", message: "Command queued for the POS." };
  } catch (error) {
    return actionError(error);
  }
}

export async function publishVersionAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = versionSchema.safeParse(values(formData));
  if (!parsed.success) return validationState(parsed.error);
  try {
    const owner = await requireOwnerApi();
    const admin = createSupabaseAdminClient();
    const isLatest = parsed.data.status === "published" && formData.get("isLatest") === "on";
    if (isLatest) {
      const cleared = await admin.from("app_versions").update({ is_latest: false }).neq("version", "");
      if (cleared.error) return databaseError(cleared.error.message);
    }
    const result = await admin.from("app_versions").insert({
      version: parsed.data.version,
      download_url: parsed.data.downloadUrl,
      notes: parsed.data.notes,
      required: formData.get("required") === "on",
      is_latest: isLatest,
      status: parsed.data.status,
    });
    if (result.error) return databaseError(result.error.message);
    await auditAdminAction({
      eventType: parsed.data.status === "published" ? "app_version_published" : "app_version_drafted",
      message: `${parsed.data.status === "published" ? "Published" : "Saved draft"} version ${parsed.data.version}`,
      metadata: { version: parsed.data.version, status: parsed.data.status, isLatest },
    }, owner);
    revalidatePath("/admin/versions");
    revalidatePath("/download");
    return { status: "success", message: "Release saved." };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateSupportTicketAction(
  ticketId: string,
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = supportSchema.safeParse(values(formData));
  if (!parsed.success) return validationState(parsed.error);
  try {
    const owner = await requireOwnerApi();
    const result = await createSupabaseAdminClient().from("support_tickets").update({
      status: parsed.data.status,
      owner_note: parsed.data.ownerNote,
      updated_at: new Date().toISOString(),
    }).eq("id", ticketId).select("ticket_number").single();
    if (result.error) return databaseError(result.error.message);
    await auditAdminAction({
      eventType: "support_ticket_updated",
      message: `Updated support ticket ${result.data.ticket_number}`,
      metadata: { ticketId, status: parsed.data.status },
    }, owner);
    revalidatePath("/admin/support");
    return { status: "success", message: "Support ticket updated." };
  } catch (error) {
    return actionError(error);
  }
}
