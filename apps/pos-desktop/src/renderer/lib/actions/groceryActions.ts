import { fail, id, ok, readStore, vendorTotals, writeStore } from "./groceryStore";

function normalizePurchase(data: any) {
  const quantity = Number(data.quantity || 0);
  const unitPrice = Number(data.unitPrice || 0);
  const totalAmount = Number(data.totalAmount || quantity * unitPrice || 0);
  const isCredit = ["CREDIT", "BANK_TRANSFER"].includes(data.paymentMethod);
  return {
    _id: data._id || id("grocery"),
    itemName: data.itemName || "",
    category: data.category || "Other",
    quantity,
    unit: data.unit || "pcs",
    unitPrice,
    vendorName: data.vendorName || "",
    vendorContact: data.vendorContact || "",
    orderedBy: data.orderedBy || "",
    orderedByRole: data.orderedByRole || "",
    totalAmount,
    paidAmount: data.paidAmount ?? (isCredit ? 0 : totalAmount),
    remainingAmount: data.remainingAmount ?? (isCredit ? totalAmount : 0),
    paymentMethod: data.paymentMethod || "CASH",
    status: data.status || "PENDING",
    notes: data.notes || "",
    isArchived: data.isArchived || false,
    orderDate: data.orderDate || new Date().toISOString(),
    createdAt: data.createdAt || new Date().toISOString(),
    paymentHistory: data.paymentHistory || [],
    returns: data.returns || [],
    returnedQuantity: data.returnedQuantity || 0,
    ...data,
  };
}

export async function createGroceryPurchase(data: any) {
  const store = readStore();
  const purchase = normalizePurchase(data);
  if (!purchase.itemName) return fail("Item name is required");
  store.groceries.unshift(purchase);
  if (purchase.vendorName && !store.vendors.some((vendor) => vendor.vendorName === purchase.vendorName)) {
    store.vendors.push({ _id: id("vendor"), vendorName: purchase.vendorName, phoneNumber: purchase.vendorContact, isActive: true });
  }
  await writeStore(store);
  return ok(purchase, "Purchase created successfully");
}

export async function updateGroceryPurchase(idValue: string, data: any) {
  const store = readStore();
  const index = store.groceries.findIndex((item) => item._id === idValue);
  if (index < 0) return fail("Purchase not found");
  store.groceries[index] = normalizePurchase({ ...store.groceries[index], ...data, _id: idValue });
  await writeStore(store);
  return ok(store.groceries[index], "Purchase updated successfully");
}

export async function deleteGroceryPurchase(idValue: string) {
  const store = readStore();
  store.groceries = store.groceries.filter((item) => item._id !== idValue);
  await writeStore(store);
  return ok({ id: idValue }, "Purchase deleted successfully");
}

export async function archiveGroceryPurchase(idValue: string) {
  return updateGroceryPurchase(idValue, { isArchived: true });
}

export async function restoreGroceryPurchase(idValue: string) {
  return updateGroceryPurchase(idValue, { isArchived: false });
}

export async function markCreditPaid(idValue: string, paymentAmount: number, paymentMethod = "CASH", note = "", paidBy = "") {
  const store = readStore();
  const item = store.groceries.find((entry) => entry._id === idValue);
  if (!item) return fail("Purchase not found");
  const amount = Math.min(Number(paymentAmount || 0), Number(item.remainingAmount || 0));
  item.paidAmount = Number(item.paidAmount || 0) + amount;
  item.remainingAmount = Math.max(0, Number(item.remainingAmount || 0) - amount);
  item.paymentHistory = [...(item.paymentHistory || []), { amount, paymentMethod, note, paidBy, paidAt: new Date().toISOString() }];
  await writeStore(store);
  return ok(item, "Payment recorded successfully");
}

export async function getAllGroceries(filters: any = {}) {
  let groceries = readStore().groceries.filter((item) => !item.isArchived);
  if (filters.status && filters.status !== "ALL") groceries = groceries.filter((item) => item.status === filters.status);
  if (filters.search) groceries = groceries.filter((item) => item.itemName.toLowerCase().includes(String(filters.search).toLowerCase()));
  return ok(groceries);
}

export async function getArchivedGroceries() {
  return ok(readStore().groceries.filter((item) => item.isArchived));
}

export async function getUnpaidCredits() {
  const data = readStore().groceries.filter((item) => Number(item.remainingAmount || 0) > 0);
  return { success: true, data, total: data.reduce((sum, item) => sum + Number(item.remainingAmount || 0), 0) };
}

export async function getGroceryStats() {
  const groceries = readStore().groceries.filter((item) => !item.isArchived);
  const totalAmount = groceries.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
  const pendingAmount = groceries.reduce((sum, item) => sum + Number(item.remainingAmount || 0), 0);
  return ok({
    totalPurchases: groceries.length,
    totalAmount,
    pendingAmount,
    completedPurchases: groceries.filter((item) => item.status === "COMPLETED").length,
    pendingPurchases: groceries.filter((item) => item.status === "PENDING").length,
  });
}

export async function getVendorsList() {
  return ok(readStore().vendors.map((vendor) => ({ ...vendor, ...vendorTotals(vendor.vendorName) })));
}

export async function getVendorAnalysis() {
  return getVendorsList();
}

export async function getCategoryAnalysis() {
  const totals = new Map<string, number>();
  for (const item of readStore().groceries) totals.set(item.category, (totals.get(item.category) || 0) + Number(item.totalAmount || 0));
  return ok([...totals.entries()].map(([name, value]) => ({ name, value })));
}

export async function getMonthlyTrend() {
  return ok([]);
}

export async function bulkUpdateStatus(ids: string[], status: string) {
  const store = readStore();
  for (const item of store.groceries) if (ids.includes(item._id)) item.status = status;
  await writeStore(store);
  return ok({ ids, status }, "Status updated");
}

export async function getPendingOrders() {
  return ok(readStore().groceries.filter((item) => item.status === "PENDING"));
}
