import type { z } from "zod";
import type {
  activationRequestSchema,
  activationStateSchema,
  appVersionSchema,
  backupLogSchema,
  backupTypeSchema,
  createOrderSchema,
  orderStatusSchema,
  orderTypeSchema,
  paymentMethodSchema,
  restaurantConfigSchema,
} from "./schemas";

export type RestaurantConfig = z.infer<typeof restaurantConfigSchema>;
export type ActivationRequest = z.infer<typeof activationRequestSchema>;
export type ActivationState = z.infer<typeof activationStateSchema>;
export type BackupLog = z.infer<typeof backupLogSchema>;
export type BackupType = z.infer<typeof backupTypeSchema>;
export type AppVersion = z.infer<typeof appVersionSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderType = z.infer<typeof orderTypeSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export type ApiResult<T> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; code?: string };

export type DeviceInfo = {
  deviceId: string;
  computerName: string;
  os: string;
  appVersion: string;
};

export type DeviceLeasePayload = {
  restaurantId: string;
  restaurantCode: string;
  deviceId: string;
  status: "approved";
  leaseVersion: number;
  configRevision: number;
  issuedAt: string;
  expiresAt: string;
};

export type SignedDeviceLease = {
  payload: DeviceLeasePayload;
  signature: string;
  publicKey: Record<string, unknown>;
};

export type CloudSnapshot = {
  id: string;
  fileName: string;
  sizeBytes: number;
  checksumSha256: string;
  databaseChecksum: string;
  checksumKind: "recovery_v1" | "logical_v1" | "file_sha256";
  syncSequence: number;
  schemaVersion: number;
  snapshotType: "manual" | "weekly" | "monthly";
  status: "verified" | "failed";
  verifiedAt?: string;
  createdAt: string;
  deviceId: string;
};

export type SyncEvent = {
  eventId: string;
  entity: string;
  entityId: string;
  operation: "upsert" | "delete";
  payload?: Record<string, unknown> | null;
  occurredAt: string;
};

export type SyncStatus = {
  online: boolean;
  pendingEvents: number;
  pendingSnapshots: number;
  lastSuccessfulSync?: string;
  lastCloudSequence: number;
  latestSnapshot?: CloudSnapshot;
  nextSnapshotAt?: string;
  recoveryReady: boolean;
  error?: string;
};

export type DataCommand = {
  id: string;
  action: "push_backup" | "restore_latest";
  status: "pending" | "running" | "completed" | "failed";
  requestedAt: string;
};

export type SystemStatus = {
  online: boolean;
  appVersion: string;
  dataRoot: string;
  databasePath?: string;
  restaurantCode?: string;
  deviceId?: string;
  activationStatus: "not_activated" | "pending" | "approved" | "blocked";
  lastCheckedAt?: string;
  leaseExpiresAt?: string;
  sync?: SyncStatus;
};

export type PrinterInfo = {
  name: string;
  displayName: string;
  isDefault: boolean;
  status: number;
};

export type PosSettingKey =
  | "restaurantName"
  | "restaurantLogo"
  | "address"
  | "phone1"
  | "phone2"
  | "email"
  | "taxPercentage"
  | "deliveryCharges"
  | "footerMessage"
  | "halls"
  | "defaultPaymentMethod"
  | "printCustomerTicket"
  | "splitKOTByKitchen"
  | "quickPrintEnabled"
  | "receiptWidth"
  | "printerName";

export type PosCategory = {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
};

export type PosKitchen = {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
};

export type PosMenuItem = {
  id: string;
  categoryId: string | null;
  kitchenId: string | null;
  name: string;
  imageUrl: string;
  description: string;
  sellingPrice: number;
  preparationTime: string;
  isPinned: boolean;
  isActive: boolean;
};

export type FoodImageCategory =
  | "popular"
  | "pizza"
  | "burgers"
  | "desi"
  | "bbq"
  | "chicken"
  | "rice"
  | "pasta"
  | "sandwiches"
  | "breakfast"
  | "desserts"
  | "drinks";

export type FoodImageAsset = {
  id: string;
  title: string;
  category: FoodImageCategory;
  tags: string[];
  previewUrl: string;
  localUrl: string;
  sourceName: string;
  sourceUrl: string;
  status: "queued" | "downloading" | "ready" | "failed";
  error?: string;
};

export type FoodImageLibraryStatus = {
  total: number;
  ready: number;
  queued: number;
  downloading: number;
  failed: number;
  online: boolean;
  activeTitle?: string;
};

export type PosCatalog = {
  categories: PosCategory[];
  kitchens: PosKitchen[];
  menuItems: PosMenuItem[];
};

export type PosOrderItem = {
  id: string;
  menuItemId: string | null;
  kitchenId: string | null;
  categoryId: string | null;
  categoryName: string;
  imageUrl: string;
  name: string;
  price: number;
  quantity: number;
  lineTotal: number;
};

export type PosOrder = {
  id: string;
  orderNumber: string;
  tokenNumber: string;
  orderType: OrderType;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  taxPercentage: number;
  discountAmount: number;
  deliveryCharge: number;
  total: number;
  paymentMethod: PaymentMethod;
  customerName: string;
  phoneNumber: string;
  tableNumber: string;
  address: string;
  notes: string;
  createdAt: string;
  completedAt: string | null;
  items: PosOrderItem[];
};

export type PosDashboardSummary = {
  todaySales: number;
  todayOrders: number;
  pendingOrders: number;
  activeMenuItems: number;
  averageOrderValue: number;
  recentOrders: PosOrder[];
};

export type PosBootstrap = {
  catalog: PosCatalog;
  settings: PosSettings;
  pendingOrders: PosOrder[];
  loadedAt: string;
};

export type PrintJobStatus = "queued" | "printing" | "printed" | "failed";
export type PrintReceiptType = "kot" | "token" | "bill" | "document";

export type PrintJob = {
  id: string;
  orderId: string;
  receiptType: PrintReceiptType;
  kitchenId: string | null;
  kitchenName: string;
  printerName: string;
  status: PrintJobStatus;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: string | null;
  createdAt: string;
  printedAt: string | null;
  error: string | null;
};

export type PrintQueueStatus = {
  queued: number;
  printing: number;
  failed: number;
  recentJobs: PrintJob[];
};

export type PrintEnqueueRequest = {
  orderId: string;
  receiptType: PrintReceiptType;
  itemIds?: string[];
};

export type HtmlPrintEnqueueRequest = {
  title: string;
  html: string;
  printerName?: string;
};

export type OrderCommitResult = {
  order: PosOrder;
  queuedPrintJobs: number;
  duplicate: boolean;
  committedAt: string;
};

export type UpdateOrderItemsInput = {
  orderId: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
  }>;
};

export type CompleteOrderInput = {
  orderId: string;
  paymentMethod?: PaymentMethod;
  taxPercentage?: number;
  discountAmount?: number;
  deliveryCharge?: number;
  notes?: string;
};

export type PosCustomer = {
  id: string;
  name: string;
  phoneNumber: string;
  address: string;
  email: string;
  notes: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
};

export type PosSettings = {
  restaurantName: string;
  restaurantLogo: string;
  address: string;
  phone1: string;
  phone2: string;
  email: string;
  taxPercentage: number;
  deliveryCharges: number;
  footerMessage: string;
  halls: string[];
  defaultPaymentMethod: PaymentMethod;
  printCustomerTicket: boolean;
  splitKOTByKitchen: boolean;
  quickPrintEnabled: boolean;
  receiptWidth: "58mm" | "66mm" | "80mm";
  printerName: string;
  lockedKeys: PosSettingKey[];
};

export type PosSettingsUpdate = {
  values: Partial<Omit<PosSettings, "lockedKeys">>;
  password: string;
};

export type SearchEntity =
  | "product"
  | "order"
  | "customer"
  | "vendor"
  | "grocery"
  | "setting";

export type GlobalSearchResult = {
  id: string;
  entity: SearchEntity;
  title: string;
  subtitle: string;
  keywords: string;
  score: number;
};

export type GlobalSearchResponse = {
  query: string;
  results: GlobalSearchResult[];
};

export type CsvExportKind = "orders" | "customers" | "inventory";

export type ReportExportInput = {
  title: string;
  startDate?: string;
  endDate?: string;
};
