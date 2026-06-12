import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  createOrderSchema,
  posSettingsUpdateSchema,
  updateOrderStatusSchema,
  type CompleteOrderInput,
  type CreateOrderInput,
  type GlobalSearchResponse,
  type GlobalSearchResult,
  type OrderCommitResult,
  type PosBootstrap,
  type PosCatalog,
  type PosCustomer,
  type PosDashboardSummary,
  type PosOrder,
  type PosSettings,
  type PosSettingKey,
  type UpdateOrderItemsInput,
} from "@restrozapp/shared";
import { withActivatedDatabase, type PosDatabase } from "../database/database";
import { getMenuImageDir, getRestaurantBrandingDir } from "../config/paths";
import { readActivationState } from "./stateStore";
import { copyLibraryImage } from "./imageLibraryService";
import {
  changeSettingsPassword,
  ensureSettingsPassword,
  verifySettingsPassword,
} from "./settingsSecurityService";

type OrderRow = {
  id: string;
  order_number: string;
  token_number: string;
  order_type: PosOrder["orderType"];
  status: PosOrder["status"];
  subtotal: number;
  tax: number;
  tax_percentage: number;
  discount_amount: number;
  delivery_charge: number;
  total: number;
  payment_method: PosOrder["paymentMethod"];
  customer_name: string;
  phone_number: string;
  table_number: string;
  address: string;
  notes: string;
  created_at: string;
  completed_at: string | null;
  client_request_id?: string | null;
};

let bootstrapCache: { restaurantCode: string; data: PosBootstrap } | null = null;

export function invalidatePosBootstrapCache() {
  bootstrapCache = null;
}

function markRecoverySnapshotRequired(db: PosDatabase) {
  const now = new Date().toISOString();
  const save = db.prepare(`
    INSERT INTO sync_state (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);
  save.run("snapshot_required", "1", now);
  save.run("next_snapshot_at", new Date(Date.now() + 10 * 60 * 1000).toISOString(), now);
}

function restaurantCode() {
  const state = readActivationState();
  if (state.status !== "approved" || !state.restaurant?.restaurantCode) {
    throw new Error("This device is not activated.");
  }
  return state.restaurant.restaurantCode;
}

function menuImageUrl(fileName: string | null | undefined) {
  return fileName ? `restrozapp-media://menu/${encodeURIComponent(fileName)}` : "";
}

function saveMenuImage(dataUrl: unknown) {
  if (typeof dataUrl !== "string" || !dataUrl) return "";
  const match = /^data:image\/jpeg;base64,([a-z0-9+/=\r\n]+)$/i.exec(dataUrl);
  if (!match) throw new Error("Menu image must be a valid JPEG.");
  const bytes = Buffer.from(match[1], "base64");
  if (!bytes.length || bytes.length > 750_000) throw new Error("Menu image is too large.");
  const fileName = `${randomUUID()}.jpg`;
  fs.writeFileSync(path.join(getMenuImageDir(restaurantCode()), fileName), bytes);
  return fileName;
}

function removeMenuImage(fileName: unknown) {
  if (typeof fileName !== "string" || !/^[a-f0-9-]+\.jpg$/i.test(fileName)) return;
  fs.rmSync(path.join(getMenuImageDir(restaurantCode()), fileName), { force: true });
}

function removeMenuImageIfUnreferenced(fileName: unknown) {
  if (typeof fileName !== "string" || !/^[a-f0-9-]+\.jpg$/i.test(fileName)) return;
  const code = restaurantCode();
  const references = withActivatedDatabase(code, (db) => {
    const menu = db.prepare("SELECT COUNT(*) AS count FROM menu_items WHERE image_file = ?")
      .get(fileName) as { count: number };
    const orders = db.prepare("SELECT COUNT(*) AS count FROM order_items WHERE image_file = ?")
      .get(fileName) as { count: number };
    return Number(menu.count) + Number(orders.count);
  });
  if (references === 0) {
    fs.rmSync(path.join(getMenuImageDir(code), fileName), { force: true });
  }
}

const LOGO_FORMATS = {
  "image/png": { extension: "png", signature: (bytes: Buffer) => bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")) },
  "image/jpeg": { extension: "jpg", signature: (bytes: Buffer) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/webp": { extension: "webp", signature: (bytes: Buffer) => bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP" },
} as const;

export function saveRestaurantLogo(input: { dataUrl: string | null; password: string }) {
  try {
    const state = readActivationState();
    if (state.restaurant?.lockedSettingKeys.includes("restaurantLogo")) {
      throw new Error("Restaurant logo is managed by the owner admin panel.");
    }
    const code = restaurantCode();
    const passwordValid = withActivatedDatabase(code, (db) => verifySettingsPassword(db, input.password));
    if (!passwordValid) throw new Error("Current password is incorrect.");

    let logoUrl = "";
    let logoFile: { fileName: string; bytes: Buffer } | null = null;
    if (input.dataUrl) {
      const match = /^data:(image\/(?:png|jpeg|webp));base64,([a-z0-9+/=\r\n]+)$/i.exec(input.dataUrl);
      if (!match) throw new Error("Logo must be a PNG, JPEG, or WebP image.");
      const mime = match[1].toLowerCase() as keyof typeof LOGO_FORMATS;
      const format = LOGO_FORMATS[mime];
      const bytes = Buffer.from(match[2], "base64");
      if (!bytes.length || bytes.length > 2_000_000) throw new Error("Logo must be smaller than 2 MB.");
      if (!format.signature(bytes)) throw new Error("The selected logo file is invalid.");
      logoFile = { fileName: `restaurant-logo.${format.extension}`, bytes };
      const version = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
      logoUrl = `restrozapp-media://branding/${logoFile.fileName}?v=${version}`;
    }

    const directory = getRestaurantBrandingDir(code);
    for (const file of fs.readdirSync(directory)) {
      if (/^restaurant-logo\.(?:png|jpe?g|webp)$/i.test(file)) {
        fs.rmSync(path.join(directory, file), { force: true });
      }
    }
    if (logoFile) {
      fs.writeFileSync(path.join(directory, logoFile.fileName), logoFile.bytes, { flag: "w" });
    }

    const data = withActivatedDatabase<PosSettings>(code, (db) => {
      db.prepare(`
        INSERT INTO local_settings (key, value, updated_at)
        VALUES ('restaurantLogo', ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).run(logoUrl, new Date().toISOString());
      markRecoverySnapshotRequired(db);
      return getPosSettingsFromDb(db);
    });
    invalidatePosBootstrapCache();
    return { ok: true as const, data, message: logoUrl ? "Restaurant logo updated." : "Restaurant logo removed." };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to save restaurant logo." };
  }
}

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function mapOrder(db: PosDatabase, row: OrderRow): PosOrder {
  const items = db.prepare(`
    SELECT
      oi.id, oi.menu_item_id, oi.kitchen_id, oi.category_id, oi.image_file,
      oi.name, oi.price, oi.quantity,
      COALESCE(c.name, 'Restaurant') AS category_name
    FROM order_items oi
    LEFT JOIN categories c ON c.id = oi.category_id
    WHERE oi.order_id = ?
    ORDER BY oi.rowid
  `).all(row.id) as Array<{
    id: string;
    menu_item_id: string | null;
    kitchen_id: string | null;
    category_id: string | null;
    category_name: string;
    image_file: string;
    name: string;
    price: number;
    quantity: number;
  }>;

  return {
    id: row.id,
    orderNumber: row.order_number,
    tokenNumber: row.token_number,
    orderType: row.order_type,
    status: row.status,
    subtotal: row.subtotal,
    tax: row.tax,
    taxPercentage: row.tax_percentage,
    discountAmount: row.discount_amount,
    deliveryCharge: row.delivery_charge,
    total: row.total,
    paymentMethod: row.payment_method,
    customerName: row.customer_name,
    phoneNumber: row.phone_number,
    tableNumber: row.table_number,
    address: row.address,
    notes: row.notes,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    items: items.map((item) => ({
      id: item.id,
      menuItemId: item.menu_item_id,
      kitchenId: item.kitchen_id,
      categoryId: item.category_id,
      categoryName: item.category_name,
      imageUrl: menuImageUrl(item.image_file),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      lineTotal: money(item.price * item.quantity),
    })),
  };
}

function listOrdersFromDb(db: PosDatabase, status?: string, limit = 50): PosOrder[] {
  const rows = (status && status !== "all"
    ? db.prepare("SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT ?").all(status, limit)
    : db.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT ?").all(limit)) as OrderRow[];
  return rows.map((row) => mapOrder(db, row));
}

function queuePrintJob(
  db: PosDatabase,
  order: PosOrder,
  receiptType: "kot" | "token" | "bill",
  settings: PosSettings,
  kitchen?: { id: string | null; name: string; items: PosOrder["items"] },
) {
  const now = new Date().toISOString();
  const state = readActivationState();
  const printableOrder = kitchen ? { ...order, items: kitchen.items } : order;
  db.prepare(`
    INSERT INTO print_jobs (
      id, receipt_type, status, created_at, error, order_id, kitchen_id,
      kitchen_name, payload, printer_name, attempts, max_attempts,
      next_attempt_at, updated_at
    ) VALUES (?, ?, 'queued', ?, NULL, ?, ?, ?, ?, ?, 0, 10, ?, ?)
  `).run(
    randomUUID(),
    receiptType,
    now,
    order.id,
    kitchen?.id || null,
    kitchen?.name || "",
    JSON.stringify({
      order: printableOrder,
      restaurant: state.restaurant ? {
        ...state.restaurant,
        restaurantName: settings.restaurantName,
        logoUrl: settings.restaurantLogo,
        address: settings.address,
        phone1: settings.phone1,
        phone2: settings.phone2,
        receiptFooter: settings.footerMessage,
      } : undefined,
      kitchenName: kitchen?.name || "",
      receiptWidth: settings.receiptWidth,
    }),
    settings.printerName,
    now,
    now,
  );
}

function queueOrderPrintJobs(db: PosDatabase, order: PosOrder, settings: PosSettings) {
  let count = 0;
  if (settings.splitKOTByKitchen) {
    const groups = new Map<string, { id: string | null; name: string; items: PosOrder["items"] }>();
    for (const item of order.items) {
      const id = item.kitchenId || "unassigned";
      const group = groups.get(id) || {
        id: item.kitchenId,
        name: item.kitchenId
          ? (db.prepare("SELECT name FROM kitchens WHERE id = ?").get(item.kitchenId) as { name: string } | undefined)?.name || "General Kitchen"
          : "General Kitchen",
        items: [],
      };
      group.items.push(item);
      groups.set(id, group);
    }
    for (const group of groups.values()) {
      queuePrintJob(db, order, "kot", settings, group);
      count += 1;
    }
  } else {
    queuePrintJob(db, order, "kot", settings);
    count += 1;
  }
  if (order.orderType === "takeaway" && settings.printCustomerTicket) {
    queuePrintJob(db, order, "token", settings);
    count += 1;
  }
  return count;
}

export function getPosBootstrap() {
  try {
    const code = restaurantCode();
    if (bootstrapCache?.restaurantCode === code) return { ok: true as const, data: bootstrapCache.data };
    const data = withActivatedDatabase<PosBootstrap>(code, (db) => ({
      catalog: catalogFromDb(db, false),
      settings: getPosSettingsFromDb(db),
      pendingOrders: listOrdersFromDb(db, "all").filter((order) =>
        ["pending", "preparing", "ready"].includes(order.status)),
      loadedAt: new Date().toISOString(),
    }));
    bootstrapCache = { restaurantCode: code, data };
    return { ok: true as const, data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to load POS." };
  }
}

export function getCatalog() {
  try {
    const data = withActivatedDatabase<PosCatalog>(restaurantCode(), (db) => ({
      categories: (db.prepare(`
        SELECT id, name, color, is_active
        FROM categories
        WHERE is_active = 1
        ORDER BY name
      `).all() as any[]).map((row) => ({
        id: row.id,
        name: row.name,
        color: row.color,
        isActive: Boolean(row.is_active),
      })),
      kitchens: (db.prepare(`
        SELECT id, name, color, is_active
        FROM kitchens
        WHERE is_active = 1
        ORDER BY display_order, name
      `).all() as any[]).map((row) => ({
        id: row.id,
        name: row.name,
        color: row.color,
        isActive: Boolean(row.is_active),
      })),
      menuItems: (db.prepare(`
        SELECT id, category_id, kitchen_id, name, image_file, description,
               selling_price, preparation_time, is_pinned, is_active
        FROM menu_items
        WHERE is_active = 1
        ORDER BY is_pinned DESC, name
      `).all() as any[]).map((row) => ({
        id: row.id,
        categoryId: row.category_id,
        kitchenId: row.kitchen_id,
        name: row.name,
        imageUrl: menuImageUrl(row.image_file),
        description: row.description,
        sellingPrice: row.selling_price,
        preparationTime: row.preparation_time,
        isPinned: Boolean(row.is_pinned),
        isActive: Boolean(row.is_active),
      })),
    }));
    return { ok: true as const, data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to load menu." };
  }
}

function catalogFromDb(db: PosDatabase, includeInactive: boolean): PosCatalog {
  const activeClause = includeInactive ? "" : "WHERE is_active = 1";
  return {
    categories: (db.prepare(`
      SELECT id, name, color, is_active
      FROM categories
      ${activeClause}
      ORDER BY name
    `).all() as any[]).map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      isActive: Boolean(row.is_active),
    })),
    kitchens: (db.prepare(`
      SELECT id, name, color, is_active
      FROM kitchens
      ${activeClause}
      ORDER BY display_order, name
    `).all() as any[]).map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      isActive: Boolean(row.is_active),
    })),
    menuItems: (db.prepare(`
      SELECT id, category_id, kitchen_id, name, image_file, description,
             selling_price, preparation_time, is_pinned, is_active
      FROM menu_items
      ${activeClause}
      ORDER BY is_pinned DESC, name
    `).all() as any[]).map((row) => ({
      id: row.id,
      categoryId: row.category_id,
      kitchenId: row.kitchen_id,
      name: row.name,
      imageUrl: menuImageUrl(row.image_file),
      description: row.description,
      sellingPrice: row.selling_price,
      preparationTime: row.preparation_time,
      isPinned: Boolean(row.is_pinned),
      isActive: Boolean(row.is_active),
    })),
  };
}

export function getInventoryCatalog() {
  try {
    const data = withActivatedDatabase(restaurantCode(), (db) => catalogFromDb(db, true));
    return { ok: true as const, data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to load inventory." };
  }
}

export function createMenuItem(input: any) {
  let newImageFile = "";
  try {
    newImageFile = input.libraryImageId
      ? copyLibraryImage(input.libraryImageId)
      : saveMenuImage(input.imageDataUrl);
    const data = withActivatedDatabase(restaurantCode(), (db) => {
      const name = String(input.name || "").trim();
      if (!name) throw new Error("Item name is required.");
      if (!input.categoryId) throw new Error("Category is required.");
      const category = db.prepare("SELECT id FROM categories WHERE id = ?").get(input.categoryId);
      if (!category) throw new Error("Category not found.");
      if (input.kitchenId && !db.prepare("SELECT id FROM kitchens WHERE id = ?").get(input.kitchenId)) {
        throw new Error("Kitchen not found.");
      }
      const duplicate = db.prepare("SELECT id FROM menu_items WHERE lower(name) = lower(?)").get(name);
      if (duplicate) throw new Error("A menu item with this name already exists.");
      const id = randomUUID();
      db.prepare(`
        INSERT INTO menu_items (
          id, category_id, kitchen_id, name, image_file, description, cost_price,
          selling_price, preparation_time, is_pinned, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
      `).run(
        id,
        input.categoryId,
        input.kitchenId || null,
        name,
        newImageFile,
        String(input.description || "").trim(),
        0,
        Math.max(0, Number(input.sellingPrice || 0)),
        String(input.preparationTime || "").trim(),
        input.isActive === false ? 0 : 1,
        new Date().toISOString(),
      );
      if (newImageFile) markRecoverySnapshotRequired(db);
      return catalogFromDb(db, true).menuItems.find((item) => item.id === id)!;
    });
    return { ok: true as const, data };
  } catch (error) {
    removeMenuImage(newImageFile);
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to create menu item." };
  }
}

export function updateMenuItem(input: any) {
  let newImageFile = "";
  let previousImageFile = "";
  try {
    newImageFile = input.libraryImageId
      ? copyLibraryImage(input.libraryImageId)
      : saveMenuImage(input.imageDataUrl);
    const data = withActivatedDatabase(restaurantCode(), (db) => {
      const name = String(input.name || "").trim();
      if (!input.id || !name) throw new Error("Item name is required.");
      const existing = db.prepare("SELECT id, image_file FROM menu_items WHERE id = ?").get(input.id) as
        | { id: string; image_file: string }
        | undefined;
      if (!existing) throw new Error("Menu item not found.");
      previousImageFile = existing.image_file;
      if (!db.prepare("SELECT id FROM categories WHERE id = ?").get(input.categoryId)) throw new Error("Category not found.");
      if (input.kitchenId && !db.prepare("SELECT id FROM kitchens WHERE id = ?").get(input.kitchenId)) {
        throw new Error("Kitchen not found.");
      }
      const duplicate = db.prepare(
        "SELECT id FROM menu_items WHERE lower(name) = lower(?) AND id <> ?",
      ).get(name, input.id);
      if (duplicate) throw new Error("A menu item with this name already exists.");
      db.prepare(`
        UPDATE menu_items
        SET category_id = ?, kitchen_id = ?, name = ?, image_file = ?, description = ?,
            cost_price = ?, selling_price = ?, preparation_time = ?, is_active = ?
        WHERE id = ?
      `).run(
        input.categoryId,
        input.kitchenId || null,
        name,
        input.removeImage ? "" : newImageFile || previousImageFile,
        String(input.description || "").trim(),
        0,
        Math.max(0, Number(input.sellingPrice || 0)),
        String(input.preparationTime || "").trim(),
        input.isActive === false ? 0 : 1,
        input.id,
      );
      if (input.removeImage || newImageFile) markRecoverySnapshotRequired(db);
      return catalogFromDb(db, true).menuItems.find((item) => item.id === input.id)!;
    });
    if ((input.removeImage || newImageFile) && previousImageFile) {
      removeMenuImageIfUnreferenced(previousImageFile);
    }
    return { ok: true as const, data };
  } catch (error) {
    removeMenuImage(newImageFile);
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to update menu item." };
  }
}

export function deleteMenuItem(id: string) {
  try {
    let removedImageFile = "";
    withActivatedDatabase(restaurantCode(), (db) => {
      const existing = db.prepare("SELECT image_file FROM menu_items WHERE id = ?").get(id) as
        | { image_file: string }
        | undefined;
      const used = db.prepare("SELECT COUNT(*) AS count FROM order_items WHERE menu_item_id = ?").get(id) as { count: number };
      if (used.count > 0) {
        db.prepare("UPDATE menu_items SET is_active = 0 WHERE id = ?").run(id);
      } else {
        db.prepare("DELETE FROM menu_items WHERE id = ?").run(id);
        removedImageFile = existing?.image_file || "";
        if (removedImageFile) markRecoverySnapshotRequired(db);
      }
    });
    removeMenuImageIfUnreferenced(removedImageFile);
    return { ok: true as const, data: { id } };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to delete menu item." };
  }
}

export function toggleMenuItemStatus(id: string) {
  try {
    const data = withActivatedDatabase(restaurantCode(), (db) => {
      db.prepare("UPDATE menu_items SET is_active = CASE is_active WHEN 1 THEN 0 ELSE 1 END WHERE id = ?").run(id);
      return catalogFromDb(db, true).menuItems.find((item) => item.id === id);
    });
    if (!data) throw new Error("Menu item not found.");
    return { ok: true as const, data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to update menu item." };
  }
}

export function bulkUpdateCategories(categories: any[]) {
  try {
    const data = withActivatedDatabase(restaurantCode(), (db) => {
      db.transaction(() => {
        for (const category of categories) {
          const name = String(category.name || "").trim();
          if (!name) throw new Error("Category name is required.");
          if (category._id && !category.isNew) {
            const duplicate = db.prepare(
              "SELECT id FROM categories WHERE lower(name) = lower(?) AND id <> ?",
            ).get(name, category._id);
            if (duplicate) throw new Error(`Category "${name}" already exists.`);
            db.prepare("UPDATE categories SET name = ?, icon = '', color = ? WHERE id = ?")
              .run(name, category.color || "#10b981", category._id);
          } else {
            const duplicate = db.prepare("SELECT id FROM categories WHERE lower(name) = lower(?)").get(name);
            if (duplicate) throw new Error(`Category "${name}" already exists.`);
            db.prepare(`
              INSERT INTO categories (id, name, icon, color, is_active, created_at)
              VALUES (?, ?, ?, ?, 1, ?)
            `).run(randomUUID(), name, "", category.color || "#10b981", new Date().toISOString());
          }
        }
      })();
      return catalogFromDb(db, true).categories;
    });
    return { ok: true as const, data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to update categories." };
  }
}

export function deleteCategory(id: string) {
  try {
    withActivatedDatabase(restaurantCode(), (db) => {
      const used = db.prepare("SELECT COUNT(*) AS count FROM menu_items WHERE category_id = ?").get(id) as { count: number };
      if (used.count > 0) throw new Error(`Cannot delete category. ${used.count} menu items are using it.`);
      db.prepare("DELETE FROM categories WHERE id = ?").run(id);
    });
    return { ok: true as const, data: { id } };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to delete category." };
  }
}

export function createKitchen(input: any) {
  try {
    const data = withActivatedDatabase(restaurantCode(), (db) => {
      const name = String(input.name || "").trim();
      if (!name) throw new Error("Kitchen name is required.");
      if (db.prepare("SELECT id FROM kitchens WHERE lower(name) = lower(?)").get(name)) {
        throw new Error("A kitchen with this name already exists.");
      }
      const id = randomUUID();
      const order = (db.prepare("SELECT COALESCE(MAX(display_order), 0) + 1 AS next FROM kitchens").get() as { next: number }).next;
      db.prepare(`
        INSERT INTO kitchens (id, name, icon, color, is_active, display_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, name, "", input.color || "#10b981", input.isActive === false ? 0 : 1, order, new Date().toISOString());
      return catalogFromDb(db, true).kitchens.find((item) => item.id === id)!;
    });
    return { ok: true as const, data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to create kitchen." };
  }
}

export function updateKitchen(input: any) {
  try {
    const data = withActivatedDatabase(restaurantCode(), (db) => {
      const name = String(input.name || "").trim();
      if (!input.id || !name) throw new Error("Kitchen name is required.");
      if (db.prepare("SELECT id FROM kitchens WHERE lower(name) = lower(?) AND id <> ?").get(name, input.id)) {
        throw new Error("A kitchen with this name already exists.");
      }
      db.prepare("UPDATE kitchens SET name = ?, icon = '', color = ?, is_active = ? WHERE id = ?")
        .run(name, input.color || "#10b981", input.isActive === false ? 0 : 1, input.id);
      return catalogFromDb(db, true).kitchens.find((item) => item.id === input.id);
    });
    if (!data) throw new Error("Kitchen not found.");
    return { ok: true as const, data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to update kitchen." };
  }
}

export function deleteKitchen(id: string) {
  try {
    withActivatedDatabase(restaurantCode(), (db) => {
      db.transaction(() => {
        db.prepare("UPDATE menu_items SET kitchen_id = NULL WHERE kitchen_id = ?").run(id);
        db.prepare("DELETE FROM kitchens WHERE id = ?").run(id);
      })();
    });
    return { ok: true as const, data: { id } };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to delete kitchen." };
  }
}

export function toggleKitchenStatus(id: string) {
  try {
    const data = withActivatedDatabase(restaurantCode(), (db) => {
      db.prepare("UPDATE kitchens SET is_active = CASE is_active WHEN 1 THEN 0 ELSE 1 END WHERE id = ?").run(id);
      return catalogFromDb(db, true).kitchens.find((item) => item.id === id);
    });
    if (!data) throw new Error("Kitchen not found.");
    return { ok: true as const, data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to update kitchen." };
  }
}

export function getDashboardSummary() {
  try {
    const data = withActivatedDatabase<PosDashboardSummary>(restaurantCode(), (db) => {
      const totals = db.prepare(`
        SELECT
          COALESCE(SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END), 0) AS sales,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) AS orders,
          COALESCE(SUM(CASE WHEN status IN ('pending', 'preparing', 'ready') THEN 1 ELSE 0 END), 0) AS pending
        FROM orders
        WHERE date(created_at, 'localtime') = date('now', 'localtime')
      `).get() as { sales: number; orders: number; pending: number };
      const menu = db.prepare("SELECT COUNT(*) AS count FROM menu_items WHERE is_active = 1").get() as { count: number };
      return {
        todaySales: money(totals.sales),
        todayOrders: totals.orders,
        pendingOrders: totals.pending,
        activeMenuItems: menu.count,
        averageOrderValue: totals.orders ? money(totals.sales / totals.orders) : 0,
        recentOrders: listOrdersFromDb(db, undefined, 6),
      };
    });
    return { ok: true as const, data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to load dashboard." };
  }
}

export function listOrders(status?: string) {
  try {
    const data = withActivatedDatabase(restaurantCode(), (db) => listOrdersFromDb(db, status));
    return { ok: true as const, data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to load orders." };
  }
}

export function createOrder(input: CreateOrderInput) {
  try {
    const payload = createOrderSchema.parse(input);
    const data = withActivatedDatabase<OrderCommitResult>(restaurantCode(), (db) => {
      const duplicate = db.prepare("SELECT * FROM orders WHERE client_request_id = ?")
        .get(payload.clientRequestId) as OrderRow | undefined;
      if (duplicate) {
        return {
          order: mapOrder(db, duplicate),
          queuedPrintJobs: 0,
          duplicate: true,
          committedAt: duplicate.created_at,
        };
      }
      const quantities = new Map<string, number>();
      for (const item of payload.items) {
        quantities.set(item.menuItemId, (quantities.get(item.menuItemId) || 0) + item.quantity);
      }
      const ids = [...quantities.keys()];
      const placeholders = ids.map(() => "?").join(",");
      const menuItems = db.prepare(`
        SELECT
          mi.id, mi.kitchen_id, mi.category_id, mi.name, mi.image_file,
          mi.selling_price
        FROM menu_items mi
        WHERE mi.is_active = 1 AND mi.id IN (${placeholders})
      `).all(...ids) as Array<{
        id: string;
        kitchen_id: string | null;
        category_id: string | null;
        image_file: string;
        name: string;
        selling_price: number;
      }>;
      if (menuItems.length !== ids.length) throw new Error("One or more menu items are unavailable.");

      const now = new Date();
      const datePrefix = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("");
      const last = db.prepare(`
        SELECT order_number
        FROM orders
        WHERE order_number LIKE ?
        ORDER BY order_number DESC
        LIMIT 1
      `).get(`${datePrefix}-%`) as { order_number: string } | undefined;
      const sequence = last ? Number(last.order_number.slice(-4)) + 1 : 1;
      const orderNumber = `${datePrefix}-${String(sequence).padStart(4, "0")}`;
      const tokenNumber = payload.tempOrderNumber || String(sequence).padStart(3, "0");

      const subtotal = money(menuItems.reduce(
        (sum, item) => sum + item.selling_price * (quantities.get(item.id) || 0),
        0,
      ));
      const tax = money(subtotal * (payload.taxPercentage / 100));
      const discountAmount = Math.min(payload.discountAmount, subtotal + tax + payload.deliveryCharge);
      const total = money(Math.max(0, subtotal + tax + payload.deliveryCharge - discountAmount));
      const orderId = randomUUID();

      let result!: OrderCommitResult;
      db.transaction(() => {
        db.prepare(`
          INSERT INTO orders (
            id, order_number, token_number, order_type, status, subtotal, tax,
            tax_percentage, discount_amount, delivery_charge, total, total_cost,
            payment_method, customer_name, phone_number, table_number,
            address, notes, created_at, client_request_id
          ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          orderId,
          orderNumber,
          tokenNumber,
          payload.orderType,
          subtotal,
          tax,
          payload.taxPercentage,
          discountAmount,
          payload.deliveryCharge,
          total,
          0,
          payload.paymentMethod,
          payload.customerName || "Guest",
          payload.phoneNumber,
          payload.tableNumber,
          payload.address,
          payload.notes,
          now.toISOString(),
          payload.clientRequestId,
        );

        const insertItem = db.prepare(`
          INSERT INTO order_items (
            id, order_id, menu_item_id, kitchen_id, category_id, icon, image_file,
            name, price, cost_price, quantity
          ) VALUES (?, ?, ?, ?, ?, '', ?, ?, ?, 0, ?)
        `);
        for (const item of menuItems) {
          insertItem.run(
            randomUUID(),
            orderId,
            item.id,
            item.kitchen_id,
            item.category_id,
            item.image_file,
            item.name,
            item.selling_price,
            quantities.get(item.id),
          );
        }

        if (payload.phoneNumber.trim()) {
          const existing = db.prepare(
            "SELECT id FROM customers WHERE phone_number = ?",
          ).get(payload.phoneNumber.trim()) as { id: string } | undefined;
          if (existing) {
            db.prepare(`
              UPDATE customers
              SET name = ?, address = ?, order_count = order_count + 1,
                  last_order_date = ?, updated_at = ?
              WHERE id = ?
            `).run(
              payload.customerName || "Guest",
              payload.address,
              now.toISOString(),
              now.toISOString(),
              existing.id,
            );
          } else {
            db.prepare(`
              INSERT INTO customers (
                id, name, phone_number, address, order_count, last_order_date,
                created_at, updated_at
              ) VALUES (?, ?, ?, ?, 1, ?, ?, ?)
            `).run(
              randomUUID(),
              payload.customerName || "Guest",
              payload.phoneNumber.trim(),
              payload.address,
              now.toISOString(),
              now.toISOString(),
              now.toISOString(),
            );
          }
        }

        const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as OrderRow;
        const order = mapOrder(db, row);
        const settings = getPosSettingsFromDb(db);
        result = {
          order,
          queuedPrintJobs: queueOrderPrintJobs(db, order, settings),
          duplicate: false,
          committedAt: new Date().toISOString(),
        };
      })();
      return result;
    });
    return { ok: true as const, data, message: `Order ${data.order.orderNumber} created.` };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to create order." };
  }
}

function readNumericSetting(db: PosDatabase, key: string, fallback: number) {
  const row = db.prepare("SELECT value FROM local_settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  const value = Number(row?.value);
  return Number.isFinite(value) ? value : fallback;
}

function readBooleanSetting(db: PosDatabase, key: string, fallback: boolean) {
  const row = db.prepare("SELECT value FROM local_settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  if (!row) return fallback;
  return row.value === "true";
}

function readTextSetting(db: PosDatabase, key: string, fallback: string) {
  const row = db.prepare("SELECT value FROM local_settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? fallback;
}

function normalizeHalls(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : value.split(",");
          } catch {
            return value.split(",");
          }
        })()
      : [];
  return [...new Set(raw.map((hall) => String(hall).trim()).filter(Boolean))].slice(0, 20);
}

export function getPosSettings() {
  try {
    const data = withActivatedDatabase<PosSettings>(restaurantCode(), (db) => {
      const state = readActivationState();
      const restaurant = state.status === "approved" ? state.restaurant : null;
      ensureSettingsPassword(db);
      const cloud = restaurant?.operationalSettings || {};
      const lockedKeys = (restaurant?.lockedSettingKeys || []) as PosSettingKey[];
      const text = (key: PosSettingKey, fallback: string) =>
        lockedKeys.includes(key)
          ? cloud[key] === undefined ? fallback : String(cloud[key])
          : readTextSetting(db, key, fallback);
      const numeric = (key: PosSettingKey, fallback: number) =>
        lockedKeys.includes(key)
          ? Number.isFinite(Number(cloud[key])) ? Number(cloud[key]) : fallback
          : readNumericSetting(db, key, fallback);
      const boolean = (key: PosSettingKey, fallback: boolean) =>
        lockedKeys.includes(key)
          ? typeof cloud[key] === "boolean" ? Boolean(cloud[key]) : fallback
          : readBooleanSetting(db, key, fallback);
      return {
        restaurantName: text("restaurantName", restaurant?.restaurantName || "RestroZapp"),
        restaurantLogo: text("restaurantLogo", restaurant?.logoUrl || ""),
        address: text("address", restaurant?.address || ""),
        phone1: text("phone1", restaurant?.phone1 || ""),
        phone2: text("phone2", restaurant?.phone2 || ""),
        email: text("email", "admin@restaurant.com"),
        taxPercentage: numeric("taxPercentage", 0),
        deliveryCharges: numeric("deliveryCharges", 0),
        footerMessage: text("footerMessage", restaurant?.receiptFooter || "Thank You for Dining with Us!"),
        halls: lockedKeys.includes("halls")
          ? normalizeHalls(cloud.halls)
          : normalizeHalls(readTextSetting(db, "halls", "[]")),
        defaultPaymentMethod: text("defaultPaymentMethod", "cash") as PosSettings["defaultPaymentMethod"],
        printCustomerTicket: boolean("printCustomerTicket", true),
        splitKOTByKitchen: boolean("splitKOTByKitchen", false),
        quickPrintEnabled: boolean("quickPrintEnabled", true),
        receiptWidth: text("receiptWidth", "66mm") as PosSettings["receiptWidth"],
        printerName: text("printerName", ""),
        lockedKeys,
      };
    });
    return { ok: true as const, data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to load settings." };
  }
}

export function setPosSetting(input: { key: string; value: string | number | boolean }) {
  try {
    const allowed = new Set([
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
    if (!allowed.has(input.key)) throw new Error("Unsupported setting.");
    const state = readActivationState();
    if (state.restaurant?.lockedSettingKeys.includes(input.key)) {
      throw new Error(`${input.key} is managed by the owner admin panel.`);
    }
    withActivatedDatabase(restaurantCode(), (db) => {
      db.prepare(`
        INSERT INTO local_settings (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).run(
        input.key,
        input.key === "halls" ? JSON.stringify(normalizeHalls(input.value)) : String(input.value),
        new Date().toISOString(),
      );
    });
    return { ok: true as const, data: { key: input.key, value: input.value } };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to save setting." };
  }
}

export function updatePosSettings(input: unknown) {
  try {
    const payload = posSettingsUpdateSchema.parse(input);
    const state = readActivationState();
    const locked = new Set(state.restaurant?.lockedSettingKeys || []);
    const data = withActivatedDatabase<PosSettings>(restaurantCode(), (db) => {
      if (!verifySettingsPassword(db, payload.password)) throw new Error("Current password is incorrect.");
      const save = db.prepare(`
        INSERT INTO local_settings (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `);
      db.transaction(() => {
        for (const [key, value] of Object.entries(payload.values)) {
          if (locked.has(key)) continue;
          save.run(key, key === "halls" ? JSON.stringify(normalizeHalls(value)) : String(value), new Date().toISOString());
        }
      })();
      return getPosSettingsFromDb(db);
    });
    return { ok: true as const, data, message: "Settings updated." };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to update settings." };
  }
}

function getPosSettingsFromDb(db: PosDatabase): PosSettings {
  const state = readActivationState();
  const restaurant = state.restaurant;
  const lockedKeys = (restaurant?.lockedSettingKeys || []) as PosSettingKey[];
  const cloud = restaurant?.operationalSettings || {};
  const value = (key: PosSettingKey, fallback: string) =>
    lockedKeys.includes(key)
      ? cloud[key] === undefined ? fallback : String(cloud[key])
      : readTextSetting(db, key, fallback);
  const bool = (key: PosSettingKey, fallback: boolean) =>
    lockedKeys.includes(key)
      ? typeof cloud[key] === "boolean" ? Boolean(cloud[key]) : fallback
      : readBooleanSetting(db, key, fallback);
  return {
    restaurantName: value("restaurantName", restaurant?.restaurantName || "RestroZapp"),
    restaurantLogo: value("restaurantLogo", restaurant?.logoUrl || ""),
    address: value("address", restaurant?.address || ""),
    phone1: value("phone1", restaurant?.phone1 || ""),
    phone2: value("phone2", restaurant?.phone2 || ""),
    email: value("email", ""),
    taxPercentage: Number(value("taxPercentage", "0")),
    deliveryCharges: Number(value("deliveryCharges", "0")),
    footerMessage: value("footerMessage", restaurant?.receiptFooter || "Thank You for Dining with Us!"),
    halls: lockedKeys.includes("halls")
      ? normalizeHalls(cloud.halls)
      : normalizeHalls(readTextSetting(db, "halls", "[]")),
    defaultPaymentMethod: value("defaultPaymentMethod", "cash") as PosSettings["defaultPaymentMethod"],
    printCustomerTicket: bool("printCustomerTicket", true),
    splitKOTByKitchen: bool("splitKOTByKitchen", false),
    quickPrintEnabled: bool("quickPrintEnabled", true),
    receiptWidth: value("receiptWidth", "66mm") as PosSettings["receiptWidth"],
    printerName: value("printerName", ""),
    lockedKeys,
  };
}

export function verifyPosSettingsPassword(password: string) {
  try {
    const valid = withActivatedDatabase(restaurantCode(), (db) => verifySettingsPassword(db, password));
    return { ok: true as const, data: { valid } };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Password verification failed." };
  }
}

export function changePosSettingsPassword(input: { currentPassword: string; newPassword: string }) {
  try {
    withActivatedDatabase(restaurantCode(), (db) =>
      changeSettingsPassword(db, input.currentPassword, input.newPassword),
    );
    return { ok: true as const, data: { changed: true } };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Password change failed." };
  }
}

export function toggleMenuItemPin(menuItemId: string) {
  try {
    const data = withActivatedDatabase(restaurantCode(), (db) => {
      const item = db.prepare("SELECT is_pinned FROM menu_items WHERE id = ?").get(menuItemId) as
        | { is_pinned: number }
        | undefined;
      if (!item) throw new Error("Menu item not found.");
      const next = item.is_pinned ? 0 : 1;
      db.prepare("UPDATE menu_items SET is_pinned = ?, pinned_at = ? WHERE id = ?")
        .run(next, next ? new Date().toISOString() : null, menuItemId);
      return { id: menuItemId, isPinned: Boolean(next) };
    });
    return { ok: true as const, data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to update pin." };
  }
}

export function searchCustomers(query: string) {
  try {
    const term = query.trim();
    const data = withActivatedDatabase<PosCustomer[]>(restaurantCode(), (db) => {
      const like = term ? `${term.replace(/[%_]/g, "")}%` : "%";
      return (db.prepare(`
        SELECT id, name, phone_number, address, email, notes, order_count, total_spent, last_order_date
        FROM customers
        WHERE is_active = 1 AND (name LIKE ? OR phone_number LIKE ?)
        ORDER BY order_count DESC, last_order_date DESC
        LIMIT 20
      `).all(like, like) as any[]).map((row) => ({
        id: row.id,
        name: row.name,
        phoneNumber: row.phone_number,
        address: row.address,
        email: row.email,
        notes: row.notes,
        orderCount: row.order_count,
        totalSpent: row.total_spent,
        lastOrderDate: row.last_order_date,
      }));
    });
    return { ok: true as const, data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to search customers." };
  }
}

function normalizeSearchText(value: unknown) {
  return String(value || "")
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function fuzzyScore(query: string, value: string) {
  const needle = normalizeSearchText(query);
  const haystack = normalizeSearchText(value);
  if (!needle || !haystack) return 0;
  if (haystack === needle) return 100;
  if (haystack.startsWith(needle)) return 90;
  if (haystack.includes(needle)) return 75;
  let cursor = 0;
  let gaps = 0;
  for (const character of haystack) {
    if (character === needle[cursor]) cursor += 1;
    else if (cursor > 0) gaps += 1;
    if (cursor === needle.length) {
      return Math.max(30, 65 - gaps - Math.abs(haystack.length - needle.length));
    }
  }
  return 0;
}

export function globalSearch(query: string) {
  try {
    const cleaned = String(query || "").trim().slice(0, 80);
    if (cleaned.length < 2) {
      return { ok: true as const, data: { query: cleaned, results: [] } satisfies GlobalSearchResponse };
    }
    const data = withActivatedDatabase<GlobalSearchResponse>(restaurantCode(), (db) => {
      const candidates: GlobalSearchResult[] = [];
      const seen = new Set<string>();
      const append = (
        entity: GlobalSearchResult["entity"],
        id: string,
        title: string,
        subtitle: string,
        keywords: string,
      ) => {
        const score = Math.max(fuzzyScore(cleaned, title), fuzzyScore(cleaned, `${title} ${subtitle} ${keywords}`));
        const key = `${entity}:${id}`;
        if (score >= 30 && !seen.has(key)) {
          seen.add(key);
          candidates.push({ id, entity, title, subtitle, keywords, score });
        }
      };
      const ftsQuery = normalizeSearchText(cleaned)
        .split(" ")
        .filter(Boolean)
        .map((token) => `"${token.replaceAll('"', '""')}"*`)
        .join(" AND ");
      const searchRows = (ftsSql: string, fallbackSql: string) => {
        const matches = ftsQuery ? db.prepare(ftsSql).all(ftsQuery) as any[] : [];
        if (matches.length >= 20) return matches;
        const fallback = db.prepare(fallbackSql).all() as any[];
        const ids = new Set(matches.map((row) => row.id));
        return [...matches, ...fallback.filter((row) => !ids.has(row.id))];
      };

      for (const row of searchRows(`
        SELECT m.id, m.name, m.description, m.selling_price
        FROM menu_search JOIN menu_items m ON m.id = menu_search.id
        WHERE menu_search MATCH ? AND m.is_active = 1
        ORDER BY bm25(menu_search), m.is_pinned DESC LIMIT 60
      `, `
        SELECT id, name, description, selling_price
        FROM menu_items WHERE is_active = 1 ORDER BY is_pinned DESC, name LIMIT 120
      `)) {
        append("product", row.id, row.name, `Rs. ${row.selling_price}`, row.description);
      }
      for (const row of searchRows(`
        SELECT o.id, o.order_number, o.token_number, o.customer_name, o.phone_number, o.status, o.total
        FROM order_search JOIN orders o ON o.id = order_search.id
        WHERE order_search MATCH ? ORDER BY bm25(order_search) LIMIT 60
      `, `
        SELECT id, order_number, token_number, customer_name, phone_number, status, total
        FROM orders ORDER BY created_at DESC LIMIT 120
      `)) {
        append(
          "order",
          row.id,
          `Order ${row.order_number}`,
          `${row.customer_name || "Guest"} - Rs. ${row.total}`,
          `${row.token_number} ${row.phone_number} ${row.status}`,
        );
      }
      for (const row of searchRows(`
        SELECT c.id, c.name, c.phone_number, c.address, c.email
        FROM customer_search JOIN customers c ON c.id = customer_search.id
        WHERE customer_search MATCH ? AND c.is_active = 1
        ORDER BY bm25(customer_search) LIMIT 60
      `, `
        SELECT id, name, phone_number, address, email
        FROM customers WHERE is_active = 1 ORDER BY last_order_date DESC LIMIT 120
      `)) {
        append("customer", row.id, row.name, row.phone_number, `${row.address} ${row.email}`);
      }
      for (const row of searchRows(`
        SELECT v.id, v.name, v.phone, v.address
        FROM vendor_search JOIN grocery_vendors v ON v.id = vendor_search.id
        WHERE vendor_search MATCH ? ORDER BY bm25(vendor_search) LIMIT 60
      `, `
        SELECT id, name, phone, address FROM grocery_vendors ORDER BY name LIMIT 100
      `)) {
        append("vendor", row.id, row.name, row.phone, row.address);
      }
      for (const row of searchRows(`
        SELECT g.id, g.invoice_number, g.vendor_name, g.total, g.purchase_date, g.payload
        FROM grocery_search JOIN grocery_purchases g ON g.id = grocery_search.id
        WHERE grocery_search MATCH ? ORDER BY bm25(grocery_search) LIMIT 60
      `, `
        SELECT id, invoice_number, vendor_name, total, purchase_date, payload
        FROM grocery_purchases ORDER BY purchase_date DESC LIMIT 100
      `)) {
        append("grocery", row.id, row.invoice_number || row.vendor_name || "Grocery purchase", `Rs. ${row.total}`, `${row.vendor_name} ${row.payload}`);
      }
      const settings = [
        ["restaurant", "Restaurant settings", "Name, address, contact and receipt identity"],
        ["billing", "Billing settings", "Tax, service charge, delivery and payment defaults"],
        ["printing", "Printing settings", "Printer, KOT, customer token and receipt width"],
        ["backup", "Backup and data", "Cloud snapshots, restore and database status"],
        ["system", "System settings", "Activation, device, connectivity and updates"],
        ["security", "Security settings", "Password and protected operations"],
      ];
      for (const [id, title, subtitle] of settings) append("setting", id, title, subtitle, subtitle);

      return {
        query: cleaned,
        results: candidates
          .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
          .slice(0, 30),
      };
    });
    return { ok: true as const, data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Search failed." };
  }
}

export function createCustomer(input: any) {
  try {
    const data = withActivatedDatabase<PosCustomer>(restaurantCode(), (db) => {
      const name = String(input.name || "").trim();
      const phone = String(input.phoneNumber || "").trim();
      if (!name || !phone) throw new Error("Customer name and phone number are required.");
      if (db.prepare("SELECT id FROM customers WHERE phone_number = ?").get(phone)) {
        throw new Error("Customer with this phone number already exists.");
      }
      const id = randomUUID();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO customers (
          id, name, phone_number, address, email, notes, order_count,
          total_spent, last_order_date, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, NULL, 1, ?, ?)
      `).run(id, name, phone, String(input.address || "").trim(), String(input.email || "").trim(), String(input.notes || "").trim(), now, now);
      return searchCustomerById(db, id);
    });
    return { ok: true as const, data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to create customer." };
  }
}

export function updateCustomer(input: any) {
  try {
    const data = withActivatedDatabase<PosCustomer>(restaurantCode(), (db) => {
      const name = String(input.name || "").trim();
      const phone = String(input.phoneNumber || "").trim();
      if (!input.id || !name || !phone) throw new Error("Customer name and phone number are required.");
      if (db.prepare("SELECT id FROM customers WHERE phone_number = ? AND id <> ?").get(phone, input.id)) {
        throw new Error("Another customer with this phone number already exists.");
      }
      const result = db.prepare(`
        UPDATE customers
        SET name = ?, phone_number = ?, address = ?, email = ?, notes = ?, updated_at = ?
        WHERE id = ? AND is_active = 1
      `).run(name, phone, String(input.address || "").trim(), String(input.email || "").trim(), String(input.notes || "").trim(), new Date().toISOString(), input.id);
      if (!result.changes) throw new Error("Customer not found.");
      return searchCustomerById(db, input.id);
    });
    return { ok: true as const, data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to update customer." };
  }
}

export function deleteCustomer(id: string) {
  try {
    withActivatedDatabase(restaurantCode(), (db) => {
      const result = db.prepare("UPDATE customers SET is_active = 0, updated_at = ? WHERE id = ?")
        .run(new Date().toISOString(), id);
      if (!result.changes) throw new Error("Customer not found.");
    });
    return { ok: true as const, data: { id } };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to delete customer." };
  }
}

function searchCustomerById(db: PosDatabase, id: string): PosCustomer {
  const row = db.prepare(`
    SELECT id, name, phone_number, address, email, notes, order_count, total_spent, last_order_date
    FROM customers WHERE id = ?
  `).get(id) as any;
  return {
    id: row.id,
    name: row.name,
    phoneNumber: row.phone_number,
    address: row.address,
    email: row.email,
    notes: row.notes,
    orderCount: row.order_count,
    totalSpent: row.total_spent,
    lastOrderDate: row.last_order_date,
  };
}

export function updateOrderItems(input: UpdateOrderItemsInput) {
  try {
    if (!input.orderId || !input.items.length) throw new Error("Order items are required.");
    const data = withActivatedDatabase(restaurantCode(), (db) => {
      const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(input.orderId) as OrderRow | undefined;
      if (!order) throw new Error("Order not found.");
      if (["completed", "cancelled"].includes(order.status)) {
        throw new Error("Completed or cancelled orders cannot be edited.");
      }

      const quantities = new Map<string, number>();
      for (const item of input.items) {
        const quantity = Math.max(1, Math.floor(Number(item.quantity)));
        quantities.set(item.menuItemId, (quantities.get(item.menuItemId) || 0) + quantity);
      }
      const ids = [...quantities.keys()];
      const placeholders = ids.map(() => "?").join(",");
      const menuItems = db.prepare(`
        SELECT
          mi.id, mi.kitchen_id, mi.category_id, mi.name, mi.image_file,
          mi.selling_price
        FROM menu_items mi
        WHERE mi.is_active = 1 AND mi.id IN (${placeholders})
      `).all(...ids) as any[];
      if (menuItems.length !== ids.length) throw new Error("One or more menu items are unavailable.");

      const subtotal = money(menuItems.reduce(
        (sum, item) => sum + item.selling_price * (quantities.get(item.id) || 0),
        0,
      ));
      const tax = money(subtotal * (order.tax_percentage / 100));
      const discountAmount = Math.min(order.discount_amount, subtotal + tax + order.delivery_charge);
      const total = money(Math.max(0, subtotal + tax + order.delivery_charge - discountAmount));

      db.transaction(() => {
        db.prepare("DELETE FROM order_items WHERE order_id = ?").run(input.orderId);
        const insert = db.prepare(`
          INSERT INTO order_items (
            id, order_id, menu_item_id, kitchen_id, category_id, icon, image_file,
            name, price, cost_price, quantity
          ) VALUES (?, ?, ?, ?, ?, '', ?, ?, ?, 0, ?)
        `);
        for (const item of menuItems) {
          insert.run(
            randomUUID(),
            input.orderId,
            item.id,
            item.kitchen_id,
            item.category_id,
            item.image_file,
            item.name,
            item.selling_price,
            quantities.get(item.id),
          );
        }
        db.prepare(`
          UPDATE orders
          SET subtotal = ?, tax = ?, discount_amount = ?, total = ?, total_cost = 0
          WHERE id = ?
        `).run(subtotal, tax, discountAmount, total, input.orderId);
      })();

      return mapOrder(db, db.prepare("SELECT * FROM orders WHERE id = ?").get(input.orderId) as OrderRow);
    });
    return { ok: true as const, data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to update order." };
  }
}

export function completeOrder(input: CompleteOrderInput) {
  try {
    const data = withActivatedDatabase(restaurantCode(), (db) => {
      const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(input.orderId) as OrderRow | undefined;
      if (!order) throw new Error("Order not found.");
      if (order.status === "cancelled") throw new Error("Cancelled orders cannot be completed.");

      const taxPercentage = Math.max(0, Math.min(100, Number(input.taxPercentage ?? order.tax_percentage)));
      const deliveryCharge = Math.max(0, Number(input.deliveryCharge ?? order.delivery_charge));
      const discountAmount = Math.max(0, Number(input.discountAmount ?? order.discount_amount));
      const tax = money(order.subtotal * (taxPercentage / 100));
      const appliedDiscount = Math.min(discountAmount, order.subtotal + tax + deliveryCharge);
      const total = money(Math.max(0, order.subtotal + tax + deliveryCharge - appliedDiscount));
      const completedAt = new Date().toISOString();

      let completed!: PosOrder;
      db.transaction(() => {
        db.prepare(`
          UPDATE orders
          SET status = 'completed', payment_method = ?, tax_percentage = ?, tax = ?,
              discount_amount = ?, delivery_charge = ?, total = ?, notes = ?,
              completed_at = ?
          WHERE id = ?
        `).run(
          input.paymentMethod || order.payment_method,
          taxPercentage,
          tax,
          appliedDiscount,
          deliveryCharge,
          total,
          input.notes ?? order.notes,
          completedAt,
          input.orderId,
        );

        if (order.phone_number) {
          db.prepare(`
            UPDATE customers
            SET total_spent = total_spent + ?, last_order_date = ?, updated_at = ?
            WHERE phone_number = ?
          `).run(total, completedAt, completedAt, order.phone_number);
        }
        completed = mapOrder(db, db.prepare("SELECT * FROM orders WHERE id = ?").get(input.orderId) as OrderRow);
        queuePrintJob(db, completed, "bill", getPosSettingsFromDb(db));
      })();
      return completed;
    });
    return { ok: true as const, data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to complete order." };
  }
}

export function enqueueOrderPrint(input: {
  orderId: string;
  receiptType: "kot" | "token" | "bill";
  itemIds?: string[];
}) {
  try {
    const data = withActivatedDatabase(restaurantCode(), (db) => {
      const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(input.orderId) as OrderRow | undefined;
      if (!row) throw new Error("Order not found.");
      let order = mapOrder(db, row);
      if (input.itemIds?.length) {
        const wanted = new Set(input.itemIds);
        order = { ...order, items: order.items.filter((item) => wanted.has(item.id) || (item.menuItemId && wanted.has(item.menuItemId))) };
      }
      if (!order.items.length) throw new Error("No printable items selected.");
      queuePrintJob(db, order, input.receiptType, getPosSettingsFromDb(db));
      return { queued: true as const };
    });
    return { ok: true as const, data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to queue print." };
  }
}

export function updateOrderStatus(input: { orderId: string; status: PosOrder["status"] }) {
  try {
    const payload = updateOrderStatusSchema.parse(input);
    const data = withActivatedDatabase(restaurantCode(), (db) => {
      const current = db.prepare("SELECT status FROM orders WHERE id = ?").get(payload.orderId) as
        | { status: PosOrder["status"] }
        | undefined;
      if (!current) throw new Error("Order not found.");
      if (current.status === "cancelled" || current.status === "completed") {
        throw new Error("Completed or cancelled orders cannot be changed.");
      }

      db.prepare(`
        UPDATE orders
        SET status = ?, completed_at = CASE WHEN ? = 'completed' THEN ? ELSE completed_at END
        WHERE id = ?
      `).run(payload.status, payload.status, new Date().toISOString(), payload.orderId);
      return mapOrder(db, db.prepare("SELECT * FROM orders WHERE id = ?").get(payload.orderId) as OrderRow);
    });
    return { ok: true as const, data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to update order." };
  }
}
