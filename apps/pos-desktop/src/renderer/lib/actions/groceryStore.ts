type Store = {
  groceries: any[];
  vendors: any[];
};

const KEY = "restrozapp:grocery-store:v1";

export function readStore(): Store {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{"groceries":[],"vendors":[]}');
  } catch {
    return { groceries: [], vendors: [] };
  }
}

export async function initializeGroceryStore() {
  const result = await window.restrozapp.grocery.getStore();
  if (result.ok) localStorage.setItem(KEY, JSON.stringify(result.data));
}

export async function writeStore(store: Store) {
  localStorage.setItem(KEY, JSON.stringify(store));
  await window.restrozapp.grocery.setStore(store);
}

export function id(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function ok(data: any, message = "Success") {
  return { success: true, data, message };
}

export function fail(error: string) {
  return { success: false, error };
}

export function vendorTotals(vendorName: string) {
  const purchases = readStore().groceries.filter((item) => item.vendorName === vendorName && !item.isArchived);
  const totalPurchaseValue = purchases.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
  const totalPaid = purchases.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0);
  const totalPending = purchases.reduce((sum, item) => sum + Number(item.remainingAmount || 0), 0);
  return {
    totalOrders: purchases.length,
    totalPurchaseValue,
    totalPaid,
    totalPending,
    lastOrderDate: purchases[0]?.orderDate || purchases[0]?.createdAt || null,
  };
}
