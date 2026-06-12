import { fail, id, ok, readStore, vendorTotals, writeStore } from "./groceryStore";

function normalizeVendor(data: any) {
  return {
    _id: data._id || id("vendor"),
    vendorName: String(data.vendorName || data.name || "").trim(),
    phoneNumber: data.phoneNumber || data.vendorContact || "",
    address: data.address || "",
    email: data.email || "",
    isActive: data.isActive !== false,
    createdAt: data.createdAt || new Date().toISOString(),
    ...data,
  };
}

function withTotals(vendor: any) {
  return { ...vendor, ...vendorTotals(vendor.vendorName) };
}

export async function createVendor(data: any) {
  const store = readStore();
  const vendor = normalizeVendor(data);
  if (!vendor.vendorName) return fail("Vendor name is required");
  if (store.vendors.some((entry) => entry.vendorName.toLowerCase() === vendor.vendorName.toLowerCase())) {
    return fail("Vendor already exists");
  }
  store.vendors.push(vendor);
  await writeStore(store);
  return ok(withTotals(vendor), "Vendor created successfully");
}

export async function updateVendor(idValue: string, data: any) {
  const store = readStore();
  const index = store.vendors.findIndex((vendor) => vendor._id === idValue);
  if (index < 0) return fail("Vendor not found");
  store.vendors[index] = normalizeVendor({ ...store.vendors[index], ...data, _id: idValue });
  await writeStore(store);
  return ok(withTotals(store.vendors[index]), "Vendor updated successfully");
}

export async function deleteVendor(idValue: string) {
  const store = readStore();
  store.vendors = store.vendors.filter((vendor) => vendor._id !== idValue);
  await writeStore(store);
  return ok({ id: idValue }, "Vendor deleted successfully");
}

export async function getAllVendors() {
  return ok(readStore().vendors.map(withTotals));
}

export async function searchVendors(searchTerm = "") {
  const term = searchTerm.toLowerCase();
  return ok(readStore().vendors.filter((vendor) => vendor.vendorName.toLowerCase().includes(term)).map(withTotals));
}

export async function getVendorDetails(vendorName: string) {
  const store = readStore();
  const vendor = store.vendors.find((entry) => entry.vendorName === vendorName) || normalizeVendor({ vendorName });
  return ok({
    vendor: withTotals(vendor),
    purchases: store.groceries.filter((item) => item.vendorName === vendorName),
    paymentHistory: store.groceries.flatMap((item) => item.paymentHistory || []),
  });
}

export async function syncVendorStats(vendorName: string) {
  return getVendorDetails(vendorName);
}

export async function makeVendorPayment(vendorName: string, paymentAmount: number, paymentMethod = "CASH", note = "", paidBy = "") {
  const store = readStore();
  let remainingPayment = Number(paymentAmount || 0);
  for (const purchase of store.groceries.filter((item) => item.vendorName === vendorName && item.remainingAmount > 0)) {
    if (remainingPayment <= 0) break;
    const applied = Math.min(remainingPayment, purchase.remainingAmount);
    purchase.paidAmount = Number(purchase.paidAmount || 0) + applied;
    purchase.remainingAmount = Math.max(0, Number(purchase.remainingAmount || 0) - applied);
    purchase.paymentHistory = [
      ...(purchase.paymentHistory || []),
      { amount: applied, paymentMethod, note, paidBy, paidAt: new Date().toISOString() },
    ];
    remainingPayment -= applied;
  }
  await writeStore(store);
  return ok({ vendorName, paymentAmount }, "Vendor payment recorded");
}
