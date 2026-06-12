import { getOrders } from "./orders";

export async function getReportsData(filters: any = {}) {
  const result = await getOrders();
  if (!result.success) return result;

  const start = filters.startDate ? new Date(filters.startDate).getTime() : null;
  const end = filters.endDate ? new Date(filters.endDate).getTime() : null;
  const inRange = (order: any) => {
    const time = new Date(order.orderDate).getTime();
    return (start === null || time >= start) && (end === null || time <= end);
  };
  const rangedOrders = result.data.filter(inRange);
  const orders = rangedOrders.filter((order: any) => ["completed", "ready"].includes(order.status));
  const cancelledOrders = rangedOrders.filter((order: any) => order.status === "cancelled").length;

  const summary: any = {
    totalRevenue: 0,
    totalOrders: orders.length,
    totalItems: 0,
    totalDiscount: 0,
    totalTax: 0,
    cashPayments: 0,
    cardPayments: 0,
    onlinePayments: 0,
    dineInOrders: 0,
    takeawayOrders: 0,
    deliveryOrders: 0,
    dineInRevenue: 0,
    takeawayRevenue: 0,
    deliveryRevenue: 0,
    completedOrders: orders.length,
    cancelledOrders,
    averageOrderValue: 0,
  };
  const daily = new Map<string, any>();
  const items = new Map<string, any>();

  for (const order of orders) {
    summary.totalRevenue += order.total;
    summary.totalItems += order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    summary.totalDiscount += order.discountAmount || order.discount || 0;
    summary.totalTax += order.tax || 0;

    const paymentKey = `${String(order.paymentMethod).toLowerCase()}Payments`;
    if (paymentKey in summary) summary[paymentKey] += order.total;

    if (order.orderType === "dine-in") {
      summary.dineInOrders += 1;
      summary.dineInRevenue += order.total;
    } else if (order.orderType === "takeaway") {
      summary.takeawayOrders += 1;
      summary.takeawayRevenue += order.total;
    } else if (order.orderType === "delivery") {
      summary.deliveryOrders += 1;
      summary.deliveryRevenue += order.total;
    }

    const date = String(order.orderDate).slice(0, 10);
    const day = daily.get(date) || { date, revenue: 0, orders: 0, discount: 0 };
    day.revenue += order.total;
    day.orders += 1;
    day.discount += order.discountAmount || order.discount || 0;
    daily.set(date, day);

    for (const item of order.items) {
      const entry = items.get(item.name) || {
        name: item.name,
        totalQuantity: 0,
        totalRevenue: 0,
        orderCount: 0,
        averagePrice: item.price,
        category: item.category || "Uncategorized",
      };
      entry.totalQuantity += item.quantity;
      entry.totalRevenue += item.price * item.quantity;
      entry.orderCount += 1;
      items.set(item.name, entry);
    }
  }

  summary.averageOrderValue = summary.totalOrders ? summary.totalRevenue / summary.totalOrders : 0;
  const popularItems = [...items.values()].sort((a, b) => b.totalQuantity - a.totalQuantity);
  const hourCounts = new Map<number, number>();
  for (const order of orders) {
    const hour = new Date(order.orderDate).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  }
  const peakHour = [...hourCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    success: true,
    data: {
      summary,
      chartData: [...daily.values()].sort((a, b) => a.date.localeCompare(b.date)),
      orders,
      popularItems,
      topItems: popularItems.slice(0, 10),
      transactions: orders.map((order: any) => ({
        id: order.orderNumber,
        date: String(order.orderDate).slice(0, 10),
        time: new Date(order.orderDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        revenue: order.total,
        paymentMethod: order.paymentMethod,
        orderType: order.orderType,
        items: order.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
      })),
      insights: {
        bestItem: popularItems[0] || { name: "N/A", totalQuantity: 0 },
        avgOrderValue: Math.round(summary.averageOrderValue),
        peakHour: peakHour === undefined ? "N/A" : `${peakHour}:00 - ${peakHour + 1}:00`,
        totalUniqueItems: popularItems.length,
        totalItemsSold: summary.totalItems,
        avgDiscount: summary.totalOrders ? (summary.totalDiscount / summary.totalOrders).toFixed(2) : 0,
        discountPercentage: summary.totalRevenue
          ? ((summary.totalDiscount / (summary.totalRevenue + summary.totalDiscount)) * 100).toFixed(1)
          : 0,
      },
    },
  };
}
