import { withActivatedDatabase } from "../database/database";
import type { PosDatabase } from "../database/database";
import { randomUUID } from "node:crypto";
import { readActivationState } from "./stateStore";

type GroceryStore = {
  groceries?: Array<Record<string, unknown>>;
  vendors?: Array<Record<string, unknown>>;
};

function restaurantCode() {
  const state = readActivationState();
  if (state.status !== "approved" || !state.restaurant) throw new Error("POS is not activated.");
  return state.restaurant.restaurantCode;
}

export function getGroceryStore() {
  try {
    const value = withActivatedDatabase(restaurantCode(), (db) =>
      (db.prepare("SELECT value FROM grocery_store WHERE id = 'primary'").get() as { value: string }).value,
    );
    return { ok: true as const, data: JSON.parse(value) };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to load grocery data." };
  }
}

export function setGroceryStore(store: unknown) {
  try {
    const normalized = normalizeStore(store);
    const value = JSON.stringify(normalized);
    withActivatedDatabase(restaurantCode(), (db) => {
      const save = db.transaction(() => {
        const now = new Date().toISOString();
        db.prepare(`
          INSERT INTO grocery_store (id, value, updated_at) VALUES ('primary', ?, ?)
          ON CONFLICT(id) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
        `).run(value, now);
        mirrorNormalizedTables(db, normalized, now);
      });
      save();
    });
    return { ok: true as const, data: normalized };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to save grocery data." };
  }
}

function normalizeStore(store: unknown): Required<GroceryStore> {
  if (!store || typeof store !== "object") return { groceries: [], vendors: [] };
  const value = store as GroceryStore;
  return {
    groceries: Array.isArray(value.groceries) ? value.groceries : [],
    vendors: Array.isArray(value.vendors) ? value.vendors : [],
  };
}

function text(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mirrorNormalizedTables(db: PosDatabase, store: Required<GroceryStore>, now: string) {
  db.exec(`
    DELETE FROM grocery_returns;
    DELETE FROM grocery_payments;
    DELETE FROM grocery_purchase_items;
    DELETE FROM grocery_purchases;
    DELETE FROM grocery_vendors;
  `);

  const insertVendor = db.prepare(`
    INSERT INTO grocery_vendors (id, name, phone, address, payload, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const vendor of store.vendors) {
    const id = text(vendor._id || vendor.id) || randomUUID();
    insertVendor.run(
      id,
      text(vendor.vendorName || vendor.name),
      text(vendor.phoneNumber || vendor.phone),
      text(vendor.address),
      JSON.stringify(vendor),
      now,
    );
  }

  const insertPurchase = db.prepare(`
    INSERT INTO grocery_purchases (
      id, vendor_id, vendor_name, invoice_number, status, payment_method,
      total, purchase_date, payload, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertItem = db.prepare(`
    INSERT INTO grocery_purchase_items (
      id, purchase_id, name, category, quantity, unit, unit_price, payload
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertPayment = db.prepare(`
    INSERT INTO grocery_payments (
      id, purchase_id, amount, payment_method, paid_at, payload
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertReturn = db.prepare(`
    INSERT INTO grocery_returns (id, purchase_id, amount, returned_at, payload)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const purchase of store.groceries) {
    const id = text(purchase._id || purchase.id) || randomUUID();
    const vendorName = text(purchase.vendorName);
    const vendor = store.vendors.find((entry) => text(entry.vendorName || entry.name) === vendorName);
    insertPurchase.run(
      id,
      vendor ? text(vendor._id || vendor.id) : null,
      vendorName,
      text(purchase.invoiceNumber),
      text(purchase.status) || "PENDING",
      text(purchase.paymentMethod) || "CASH",
      number(purchase.totalAmount),
      text(purchase.orderDate || purchase.purchaseDate || purchase.createdAt),
      JSON.stringify(purchase),
      now,
    );
    insertItem.run(
      `${id}:item`,
      id,
      text(purchase.itemName),
      text(purchase.category),
      number(purchase.quantity),
      text(purchase.unit),
      number(purchase.unitPrice),
      JSON.stringify({
        itemName: purchase.itemName,
        category: purchase.category,
        quantity: purchase.quantity,
        unit: purchase.unit,
        unitPrice: purchase.unitPrice,
      }),
    );
    const payments = Array.isArray(purchase.paymentHistory) ? purchase.paymentHistory : [];
    payments.forEach((payment, index) => insertPayment.run(
      text((payment as any).id) || `${id}:payment:${index}`,
      id,
      number((payment as any).amount),
      text((payment as any).paymentMethod) || "CASH",
      text((payment as any).paidAt),
      JSON.stringify(payment),
    ));
    const returns = Array.isArray(purchase.returns) ? purchase.returns : [];
    returns.forEach((item, index) => insertReturn.run(
      text((item as any).id) || `${id}:return:${index}`,
      id,
      number((item as any).returnAmount || (item as any).amount),
      text((item as any).returnedAt || (item as any).returnDate),
      JSON.stringify(item),
    ));
  }
}

export function rebuildNormalizedGroceryTables(db: PosDatabase) {
  const row = db.prepare("SELECT value FROM grocery_store WHERE id = 'primary'").get() as
    | { value: string }
    | undefined;
  const store = normalizeStore(row?.value ? JSON.parse(row.value) : null);
  mirrorNormalizedTables(db, store, new Date().toISOString());
}
