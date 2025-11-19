// lib/actions/reports.js
'use server';

import connectDB from '../db';
import Order from '@/models/Order';

export async function getReportsData(filters = {}) {
  try {
    await connectDB();
    
    // Build query based on filters
    const query = { status: { $in: ['completed', 'ready'] } };

    // Date filtering with proper time handling
    if (filters.startDate || filters.endDate) {
      query.orderDate = {};
      if (filters.startDate) {
        // Use the ISO string directly - it already contains the time
        query.orderDate.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        // Use the ISO string directly - it already contains the time
        query.orderDate.$lte = new Date(filters.endDate);
      }
    }

    // Get all orders for the period
    const orders = await Order.find(query)
      .sort({ orderDate: -1 })
      .lean();

    // Calculate summary statistics
    const summary = {
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      totalOrders: orders.length,
      totalItems: 0,
      totalDiscount: 0,
      totalTax: 0,
      cashPayments: 0,
      cardPayments: 0,
      onlinePayments: 0,
      // Order type breakdowns
      dineInOrders: 0,
      takeawayOrders: 0,
      deliveryOrders: 0,
      dineInRevenue: 0,
      takeawayRevenue: 0,
      deliveryRevenue: 0,
    };

    orders.forEach(order => {
      summary.totalRevenue += order.total;
      summary.totalCost += order.totalCost;
      summary.totalProfit += order.totalProfit;
      summary.totalItems += order.items.reduce((sum, item) => sum + item.quantity, 0);
      
      summary.totalDiscount += (order.discount || 0);
      summary.totalTax += (order.tax || 0);

      // Payment method breakdown (case-insensitive)
      const paymentMethod = (order.paymentMethod || '').toLowerCase();
      if (paymentMethod === 'cash') {
        summary.cashPayments += order.total;
      } else if (paymentMethod === 'card') {
        summary.cardPayments += order.total;
      } else if (paymentMethod === 'online') {
        summary.onlinePayments += order.total;
      }

      // Order type breakdown
      if (order.orderType === 'dine-in') {
        summary.dineInOrders++;
        summary.dineInRevenue += order.total;
      } else if (order.orderType === 'takeaway') {
        summary.takeawayOrders++;
        summary.takeawayRevenue += order.total;
      } else if (order.orderType === 'delivery') {
        summary.deliveryOrders++;
        summary.deliveryRevenue += order.total;
      }
    });

    summary.averageOrderValue = summary.totalOrders > 0 
      ? summary.totalRevenue / summary.totalOrders 
      : 0;

    // Group by date for charts
    const dailyData = {};
    orders.forEach(order => {
      const dateStr = order.orderDate.toISOString().split('T')[0];
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = {
          date: dateStr,
          revenue: 0,
          profit: 0,
          orders: 0,
          cost: 0,
          discount: 0,
        };
      }
      dailyData[dateStr].revenue += order.total;
      dailyData[dateStr].profit += order.totalProfit;
      dailyData[dateStr].cost += order.totalCost;
      dailyData[dateStr].discount += (order.discount || 0);
      dailyData[dateStr].orders += 1;
    });

    const chartData = Object.values(dailyData).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Get ALL items with detailed information
    const itemStats = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!itemStats[item.name]) {
          itemStats[item.name] = {
            name: item.name,
            totalQuantity: 0,
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0,
            orderCount: 0,
            averagePrice: 0,
            category: item.category || 'Uncategorized',
          };
        }
        
        const itemRevenue = item.price * item.quantity;
        const itemCost = (item.costPrice || 0) * item.quantity;
        const itemProfit = itemRevenue - itemCost;
        
        itemStats[item.name].totalQuantity += item.quantity;
        itemStats[item.name].totalRevenue += itemRevenue;
        itemStats[item.name].totalCost += itemCost;
        itemStats[item.name].totalProfit += itemProfit;
        itemStats[item.name].orderCount += 1;
        itemStats[item.name].averagePrice = item.price;
      });
    });

    // Filter items with quantity > 1 and sort by quantity sold
    const popularItems = Object.values(itemStats)
      .filter(item => item.totalQuantity > 1)
      .map(item => ({
        ...item,
        profitMargin: item.totalRevenue > 0 
          ? ((item.totalProfit / item.totalRevenue) * 100).toFixed(1) 
          : 0,
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity);

    // Get top 10 for highlights
    const topItems = popularItems.slice(0, 10);

    // Format transactions
    const transactions = orders.map(order => ({
      id: order.orderNumber,
      date: order.orderDate.toISOString().split('T')[0],
      time: new Date(order.orderDate).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      }),
      revenue: order.total,
      cost: order.totalCost,
      profit: order.totalProfit,
      discount: order.discount || 0,
      paymentMethod: order.paymentMethod,
      orderType: order.orderType,
      items: order.items.reduce((sum, item) => sum + item.quantity, 0),
    }));

    // Calculate peak hours
    const hourCounts = {};
    orders.forEach(order => {
      const hour = new Date(order.orderDate).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHour = Object.entries(hourCounts).reduce(
      (peak, [hour, count]) => (count > (peak[1] || 0) ? [hour, count] : peak),
      ['0', 0]
    );

    const insights = {
      bestItem: topItems[0] || { name: 'N/A', totalQuantity: 0 },
      avgOrderValue: Math.round(summary.averageOrderValue),
      peakHour: peakHour[0] ? `${peakHour[0]}:00 - ${parseInt(peakHour[0]) + 1}:00` : 'N/A',
      totalUniqueItems: popularItems.length,
      totalItemsSold: summary.totalItems,
      avgDiscount: summary.totalOrders > 0 ? (summary.totalDiscount / summary.totalOrders).toFixed(2) : 0,
      discountPercentage: summary.totalRevenue > 0 ? ((summary.totalDiscount / (summary.totalRevenue + summary.totalDiscount)) * 100).toFixed(1) : 0,
    };

    return {
      success: true,
      data: {
        summary,
        chartData,
        transactions,
        popularItems,
        topItems,
        insights,
      },
    };
  } catch (error) {
    console.error('Error fetching reports data:', error);
    return { 
      success: false,
      message: 'Failed to fetch reports data. Please try again.',
      error: error.message 
    };
  }
}

export async function getOrderTypeBreakdown(filters = {}) {
  try {
    await connectDB();
    
    const query = { status: { $in: ['completed', 'ready'] } };

    if (filters.startDate || filters.endDate) {
      query.orderDate = {};
      if (filters.startDate) query.orderDate.$gte = new Date(filters.startDate);
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        query.orderDate.$lte = endDate;
      }
    }

    const result = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$orderType',
          count: { $sum: 1 },
          revenue: { $sum: '$total' },
          profit: { $sum: '$totalProfit' },
        },
      },
    ]);

    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching order type breakdown:', error);
    return { 
      success: false,
      message: 'Failed to fetch order type breakdown',
      error: error.message 
    };
  }
}