import type { PosOrder, PosOrderItem } from "@restrozapp/shared";

function inRange(dateIso: string, startDate?: string, endDate?: string) {
  const value = new Date(dateIso).getTime();
  if (startDate && value < new Date(startDate).getTime()) return false;
  if (endDate && value > new Date(endDate).getTime()) return false;
  return true;
}

export function toPosOrder(order: PosOrder) {
  return {
    _id: order.id,
    orderNumber: order.orderNumber,
    tempOrderNumber: order.tokenNumber,
    items: order.items.map((item) => ({
      _id: item.id,
      menuItemId: item.menuItemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      categoryId: item.categoryId,
      category: item.categoryName,
      imageUrl: item.imageUrl,
      kitchenId: item.kitchenId,
    })),
    orderType: order.orderType,
    status: order.status,
    subtotal: order.subtotal,
    tax: order.tax,
    taxPercentage: order.taxPercentage,
    discount: order.discountAmount,
    discountPercentage: order.subtotal > 0 ? (order.discountAmount / order.subtotal) * 100 : 0,
    discountAmount: order.discountAmount,
    deliveryCharge: order.deliveryCharge,
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: "paid",
    customerName: order.customerName,
    phoneNumber: order.phoneNumber,
    tableNumber: order.tableNumber,
    address: order.address,
    notes: order.notes,
    orderDate: order.createdAt,
    createdAt: order.createdAt,
    updatedAt: order.completedAt || order.createdAt,
    completedAt: order.completedAt,
  };
}

async function allOrders() {
  const result = await window.restrozapp.pos.listOrders("all");
  return result.ok ? result.data : [];
}

function filterOrders(orders: PosOrder[], filters: any = {}) {
  const startDate = filters.startDate ? new Date(`${filters.startDate}T00:00:00`).getTime() : null;
  const endDate = filters.endDate ? new Date(`${filters.endDate}T23:59:59.999`).getTime() : null;
  const query = String(filters.searchQuery || "").trim().toLowerCase();

  return orders.filter((order) => {
    const createdAt = new Date(order.createdAt);
    const createdTime = createdAt.getTime();
    const orderTime = createdAt.toTimeString().slice(0, 5);
    const matchesQuery =
      !query ||
      order.orderNumber.toLowerCase().includes(query) ||
      order.tokenNumber.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      order.phoneNumber.toLowerCase().includes(query) ||
      order.tableNumber.toLowerCase().includes(query);

    return (
      (!filters.status || String(order.status).toLowerCase() === String(filters.status).toLowerCase()) &&
      (!filters.orderType || order.orderType === filters.orderType) &&
      (startDate === null || createdTime >= startDate) &&
      (endDate === null || createdTime <= endDate) &&
      (!filters.startTime || orderTime >= filters.startTime) &&
      (!filters.endTime || orderTime <= filters.endTime) &&
      matchesQuery
    );
  });
}

export async function getOrdersPaginated(filters: any = {}) {
  const page = Math.max(1, Number(filters.page || 1));
  const limit = Math.max(1, Number(filters.limit || 50));
  const filtered = filterOrders(await allOrders(), filters).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit).map(toPosOrder);

  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      totalCount: filtered.length,
      totalPages: Math.ceil(filtered.length / limit),
      hasMore: start + data.length < filtered.length,
    },
  };
}

export async function getOrderStatistics(filters: any = {}) {
  const orders = filterOrders(await allOrders(), filters);
  const totalRevenue = orders
    .filter((order) => ["completed", "ready"].includes(order.status))
    .reduce((sum, order) => sum + order.total, 0);

  return {
    success: true,
    data: {
      totalCount: orders.length,
      pendingCount: orders.filter((order) => order.status === "pending").length,
      preparingCount: orders.filter((order) => order.status === "preparing").length,
      completedCount: orders.filter((order) => order.status === "completed").length,
      totalRevenue,
      avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
    },
  };
}

export async function getSalesForRange(startDate: string, endDate: string) {
  const orders = (await allOrders()).filter((order) =>
    ["completed", "ready"].includes(order.status) && inRange(order.createdAt, startDate, endDate),
  );
  const grouped = new Map<string, { _id: string; revenue: number; orders: number }>();

  for (const order of orders) {
    const key = order.createdAt.slice(0, 10);
    const entry = grouped.get(key) || { _id: key, revenue: 0, orders: 0 };
    entry.revenue += order.total;
    entry.orders += 1;
    grouped.set(key, entry);
  }

  return { success: true, data: [...grouped.values()].sort((a, b) => a._id.localeCompare(b._id)) };
}

export async function getPopularItemsForRange(startDate: string, endDate: string, limit = 10) {
  const itemMap = new Map<string, { _id: string | null; name: string; totalQuantity: number; totalRevenue: number }>();
  const orders = (await allOrders()).filter((order) =>
    ["completed", "ready"].includes(order.status) && inRange(order.createdAt, startDate, endDate),
  );

  for (const order of orders) {
    for (const item of order.items) {
      const key = item.menuItemId || item.name;
      const entry = itemMap.get(key) || {
        _id: item.menuItemId,
        name: item.name,
        totalQuantity: 0,
        totalRevenue: 0,
      };
      entry.totalQuantity += item.quantity;
      entry.totalRevenue += item.price * item.quantity;
      itemMap.set(key, entry);
    }
  }

  return {
    success: true,
    data: [...itemMap.values()].sort((a, b) => b.totalQuantity - a.totalQuantity).slice(0, limit),
  };
}

export async function getPendingOrders() {
  const result = await window.restrozapp.pos.listOrders("all");
  if (!result.ok) return { success: false, error: result.error, data: [] };
  return {
    success: true,
    data: result.data
      .filter((order) => ["pending", "preparing", "ready"].includes(order.status))
      .map(toPosOrder),
  };
}

export async function getOrders() {
  const result = await window.restrozapp.pos.listOrders("all");
  if (!result.ok) return { success: false, error: result.error, data: [] };
  return { success: true, data: result.data.map(toPosOrder) };
}

export async function createOrder(orderData: any) {
  const result = await window.restrozapp.pos.createOrder({
    clientRequestId: orderData.clientRequestId || crypto.randomUUID(),
    tempOrderNumber: orderData.tempOrderNumber,
    items: orderData.items.map((item: any) => ({
      menuItemId: item.menuItemId || item._id,
      quantity: Number(item.quantity || 1),
    })),
    orderType: orderData.orderType,
    paymentMethod: (orderData.paymentMethod || "cash").toLowerCase(),
    customerName: orderData.customerName || "Guest",
    phoneNumber: orderData.phoneNumber || "",
    tableNumber: orderData.tableNumber || "",
    address: orderData.address || "",
    notes: orderData.notes || "",
    discountAmount: Number(orderData.discountAmount || orderData.discount || 0),
    deliveryCharge: Number(orderData.deliveryCharge || 0),
    taxPercentage: Number(orderData.taxPercentage || 0),
  });

  if (!result.ok) return { success: false, error: result.error };
  return {
    success: true,
    data: toPosOrder(result.data.order),
    queuedPrintJobs: result.data.queuedPrintJobs,
    duplicate: result.data.duplicate,
  };
}

export async function completeOrder(orderId: string, details: any = {}) {
  const result = await window.restrozapp.pos.completeOrder({
    orderId,
    paymentMethod: String(details.paymentMethod || "cash").toLowerCase() as any,
    taxPercentage: Number(details.taxPercentage || 0),
    discountAmount: Number(details.discountAmount || details.discount || 0),
    deliveryCharge: Number(details.deliveryCharge || 0),
    notes: details.notes || "",
  });
  if (!result.ok) return { success: false, error: result.error };
  return { success: true, data: toPosOrder(result.data) };
}

export async function cancelOrder(orderId: string) {
  const result = await window.restrozapp.pos.updateOrderStatus({ orderId, status: "cancelled" });
  if (!result.ok) return { success: false, error: result.error };
  return { success: true, data: toPosOrder(result.data) };
}

export async function updateOrderStatus(orderId: string, status: PosOrder["status"]) {
  const result = await window.restrozapp.pos.updateOrderStatus({ orderId, status });
  if (!result.ok) return { success: false, error: result.error };
  return { success: true, data: toPosOrder(result.data) };
}

export async function reprintKOT(orderId: string) {
  const result = await window.restrozapp.pos.listOrders("all");
  if (!result.ok) return { success: false, error: result.error };
  const order = result.data.find((entry) => entry.id === orderId);
  return order ? { success: true, data: toPosOrder(order) } : { success: false, error: "Order not found" };
}

export async function updateOrderItems(orderId: string, items: any[]) {
  const result = await window.restrozapp.pos.updateOrderItems({
    orderId,
    items: items.map((item) => ({
      menuItemId: item.menuItemId || item._id,
      quantity: Number(item.quantity || 1),
    })),
  });
  if (!result.ok) return { success: false, error: result.error };
  return { success: true, data: toPosOrder(result.data) };
}

export async function getDailySales() {
  const result = await window.restrozapp.pos.getDashboard();
  if (!result.ok) return { success: false, error: result.error };
  return {
    success: true,
    data: {
      totalSales: result.data.todaySales,
      totalOrders: result.data.todayOrders,
      totalItems: result.data.recentOrders.reduce(
        (sum: number, order: PosOrder) => sum + order.items.reduce((itemSum: number, item: PosOrderItem) => itemSum + item.quantity, 0),
        0,
      ),
    },
  };
}

export async function getPopularItems(limit = 10) {
  return getPopularItemsForRange("", "", limit);
}

export async function getSalesSummary(startDate: string, endDate: string) {
  const result = await getSalesForRange(startDate, endDate);
  if (!result.success) return result;
  return {
    success: true,
    data: result.data.reduce(
      (summary: any, day: any) => ({
        totalRevenue: summary.totalRevenue + day.revenue,
        totalOrders: summary.totalOrders + day.orders,
      }),
      { totalRevenue: 0, totalOrders: 0 },
    ),
  };
}

export async function getAllTransactions() {
  const orders = await allOrders();
  return {
    success: true,
    data: orders.map((order) => ({
      id: order.orderNumber,
      date: order.createdAt.slice(0, 10),
      time: new Date(order.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      revenue: order.total,
      paymentMethod: order.paymentMethod,
      items: order.items.reduce((sum, item) => sum + item.quantity, 0),
    })),
  };
}
