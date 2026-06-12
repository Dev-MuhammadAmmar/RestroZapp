import { z } from "zod";

export const restaurantStatusSchema = z.enum(["active", "suspended", "trial"]);
export const deviceStatusSchema = z.enum(["pending", "approved", "blocked"]);
export const backupTypeSchema = z.enum(["manual", "daily", "weekly", "monthly", "emergency"]);
export const backupUploadStatusSchema = z.enum(["local_only", "pending_upload", "uploaded", "failed"]);

export const restaurantConfigSchema = z.object({
  restaurantId: z.string().uuid().optional(),
  restaurantCode: z.string().min(3).max(40),
  restaurantName: z.string().min(1),
  address: z.string().default(""),
  phone1: z.string().default(""),
  phone2: z.string().default(""),
  logoUrl: z.string().url().optional().or(z.literal("")),
  receiptFooter: z.string().default("Thank You for Dining with Us!"),
  plan: z.string().default("standard"),
  backupEnabled: z.boolean().default(true),
  operationalSettings: z.record(z.string(), z.unknown()).default({}),
  lockedSettingKeys: z.array(z.string()).default([]),
  configRevision: z.number().int().nonnegative().default(1),
});

export const activationRequestSchema = z.object({
  restaurantCode: z.string().min(3).max(40),
  activationPassword: z.string().min(4).max(200),
  deviceId: z.string().min(16),
  computerName: z.string().min(1),
  os: z.string().min(1),
  appVersion: z.string().min(1),
});

export const activationStateSchema = z.object({
  status: deviceStatusSchema.or(z.literal("not_activated")),
  deviceId: z.string().optional(),
  deviceToken: z.string().optional(),
  restaurant: restaurantConfigSchema.optional(),
  activatedAt: z.string().optional(),
  lastCheckedAt: z.string().optional(),
  message: z.string().optional(),
  lease: z.object({
    payload: z.object({
      restaurantId: z.string().uuid(),
      restaurantCode: z.string(),
      deviceId: z.string(),
      status: z.literal("approved"),
      leaseVersion: z.number(),
      configRevision: z.number(),
      issuedAt: z.string(),
      expiresAt: z.string(),
    }),
    signature: z.string(),
    publicKey: z.record(z.string(), z.unknown()),
  }).optional(),
  configRevision: z.number().optional(),
});

export const backupLogSchema = z.object({
  id: z.string(),
  restaurantCode: z.string(),
  deviceId: z.string(),
  type: backupTypeSchema,
  status: backupUploadStatusSchema,
  fileName: z.string(),
  localPath: z.string(),
  sizeBytes: z.number().nonnegative(),
  createdAt: z.string(),
  uploadedAt: z.string().optional(),
  error: z.string().optional(),
});

export const appVersionSchema = z.object({
  version: z.string(),
  downloadUrl: z.string().url().optional(),
  notes: z.string().optional(),
  required: z.boolean().default(false),
});

export const orderTypeSchema = z.enum(["dine-in", "takeaway", "delivery"]);
export const orderStatusSchema = z.enum(["pending", "preparing", "ready", "completed", "cancelled"]);
export const paymentMethodSchema = z.enum(["cash", "card", "online", "other"]);

export const posSettingKeySchema = z.enum([
  "restaurantName",
  "restaurantLogo",
  "address",
  "phone1",
  "phone2",
  "email",
  "taxPercentage",
  "deliveryCharges",
  "footerMessage",
  "halls",
  "defaultPaymentMethod",
  "printCustomerTicket",
  "splitKOTByKitchen",
  "quickPrintEnabled",
  "receiptWidth",
  "printerName",
]);

export const posSettingsUpdateSchema = z.object({
  values: z.object({
    restaurantName: z.string().trim().min(1).max(120).optional(),
    restaurantLogo: z.string().trim().max(500).optional(),
    address: z.string().trim().max(300).optional(),
    phone1: z.string().trim().max(30).optional(),
    phone2: z.string().trim().max(30).optional(),
    email: z.string().trim().email().or(z.literal("")).optional(),
    taxPercentage: z.number().min(0).max(100).optional(),
    deliveryCharges: z.number().min(0).max(1_000_000).optional(),
      footerMessage: z.string().trim().max(300).optional(),
      halls: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
      defaultPaymentMethod: paymentMethodSchema.optional(),
    printCustomerTicket: z.boolean().optional(),
    splitKOTByKitchen: z.boolean().optional(),
    quickPrintEnabled: z.boolean().optional(),
    receiptWidth: z.enum(["58mm", "66mm", "80mm"]).optional(),
    printerName: z.string().max(200).optional(),
  }),
  password: z.string().min(1).max(200),
});

export const createOrderSchema = z.object({
  clientRequestId: z.string().uuid(),
  tempOrderNumber: z.string().trim().max(80).optional(),
  items: z.array(
    z.object({
      menuItemId: z.string().min(1),
      quantity: z.number().int().min(1).max(999),
    }),
  ).min(1),
  orderType: orderTypeSchema,
  paymentMethod: paymentMethodSchema.default("cash"),
  customerName: z.string().trim().max(100).default("Guest"),
  phoneNumber: z.string().trim().max(30).default(""),
    tableNumber: z.string().trim().max(120).default(""),
  address: z.string().trim().max(300).default(""),
  notes: z.string().trim().max(500).default(""),
  discountAmount: z.number().min(0).default(0),
  deliveryCharge: z.number().min(0).default(0),
  taxPercentage: z.number().min(0).max(100).default(0),
});

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: orderStatusSchema,
});
