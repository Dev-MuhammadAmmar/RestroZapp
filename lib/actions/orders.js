// lib/actions/orders.js
'use server';

import connectDB from '../db';
import Order from '@/models/Order';
import MenuItem from '@/models/MenuItem';
import { createOrUpdateCustomer, updateCustomerSpending } from './customers';
import { revalidatePath } from 'next/cache';

// Generate order number
async function generateOrderNumber() {
  try {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    
    const lastOrder = await Order.findOne({
      orderNumber: new RegExp(`^${dateStr}`),
    }).sort({ orderNumber: -1 }).lean();
    
    let sequence = 1;
    if (lastOrder && lastOrder.orderNumber) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }
    
    const orderNumber = `${dateStr}-${sequence.toString().padStart(4, '0')}`;
    return orderNumber;
  } catch (error) {
    console.error('❌ Error generating order number:', error);
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
  }
}

// Create order
export async function createOrder(orderData) {
  try {
    await connectDB();

    const menuItemIds = orderData.items.map(item => item.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds }, isActive: true })
      .populate('categoryId', 'name icon color')
      .lean();

    if (menuItems.length !== menuItemIds.length) {
      return { error: 'Some menu items are no longer available' };
    }

    const itemsWithCost = orderData.items.map(item => {
      const menuItem = menuItems.find(mi => mi._id.toString() === item.menuItemId);
      return {
        ...item,
        costPrice: menuItem.costPrice,
        category: menuItem.categoryId?.name || 'Uncategorized',
        icon: menuItem.categoryId?.icon || (menuItem.icon || '🍽️')
      };
    });

    const totalCost = itemsWithCost.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
    const totalProfit = orderData.total - totalCost;
    const orderNumber = await generateOrderNumber();

    const order = new Order({
      orderNumber,
      items: itemsWithCost,
      orderType: orderData.orderType,
      status: 'pending',
      subtotal: orderData.subtotal,
      tax: orderData.tax,
      taxPercentage: orderData.taxPercentage || 0,
      discount: orderData.discount || 0,
      discountPercentage: orderData.discountPercentage || 0,
      deliveryCharge: orderData.deliveryCharge || 0,
      total: orderData.total,
      totalCost,
      totalProfit,
      paymentMethod: orderData.paymentMethod.toLowerCase(),
      paymentStatus: 'paid',
      customerName: orderData.customerName,
      phoneNumber: orderData.phoneNumber || null,
      tableNumber: orderData.tableNumber || null,
      address: orderData.address || null,
      notes: orderData.notes || null,
      kotPrintedAt: new Date()
    });

    await order.save();
    
    if (orderData.phoneNumber && (orderData.orderType === 'delivery' || orderData.orderType === 'takeaway')) {
      await createOrUpdateCustomer({
        name: orderData.customerName,
        phoneNumber: orderData.phoneNumber,
        address: orderData.address || '',
      });
      
      await updateCustomerSpending(orderData.phoneNumber, orderData.total);
    }

    revalidatePath('/pos');
    revalidatePath('/orders');
    revalidatePath('/reports');
    return { success: true, data: JSON.parse(JSON.stringify(order)) };
  } catch (error) {
    console.error('Error creating order:', error);
    return { error: error.message || 'Failed to create order' };
  }
}

// Get paginated orders with filters
export async function getOrdersPaginated({ 
  page = 1, 
  limit = 50, 
  status = null,
  orderType = null,
  startDate = null,
  endDate = null,
  startTime = null,
  endTime = null,
  searchQuery = null 
}) {
  try {
    await connectDB();
    const query = {};

    if (status && status !== 'All') query.status = status.toLowerCase();
    if (orderType && orderType !== 'All') query.orderType = orderType.toLowerCase();
    
    // Date and time filtering
    if (startDate || endDate) {
      query.orderDate = {};
      
      if (startDate) {
        const start = new Date(startDate);
        if (startTime) {
          const [hours, minutes] = startTime.split(':');
          start.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        } else {
          start.setHours(0, 0, 0, 0);
        }
        query.orderDate.$gte = start;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        if (endTime) {
          const [hours, minutes] = endTime.split(':');
          end.setHours(parseInt(hours), parseInt(minutes), 59, 999);
        } else {
          end.setHours(23, 59, 59, 999);
        }
        query.orderDate.$lte = end;
      }
    }

    // Search functionality
    if (searchQuery && searchQuery.trim()) {
      const searchRegex = new RegExp(searchQuery.trim(), 'i');
      query.$or = [
        { orderNumber: searchRegex },
        { customerName: searchRegex },
        { tableNumber: searchRegex },
        { phoneNumber: searchRegex }
      ];
    }

    // Get total count for pagination
    const totalCount = await Order.countDocuments(query);
    
    // Get paginated orders
    const orders = await Order.find(query)
      .sort({ orderDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;

    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(orders)),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasMore,
        pageSize: limit
      }
    };
  } catch (error) {
    console.error('Error fetching paginated orders:', error);
    return { error: 'Failed to fetch orders' };
  }
}

// NEW: Get order statistics for dashboard
export async function getOrderStatistics({
  status = null,
  orderType = null,
  startDate = null,
  endDate = null,
  startTime = null,
  endTime = null
}) {
  try {
    await connectDB();
    const query = {};

    if (status && status !== 'All') query.status = status.toLowerCase();
    if (orderType && orderType !== 'All') query.orderType = orderType.toLowerCase();
    
    // Date and time filtering
    if (startDate || endDate) {
      query.orderDate = {};
      
      if (startDate) {
        const start = new Date(startDate);
        if (startTime) {
          const [hours, minutes] = startTime.split(':');
          start.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        } else {
          start.setHours(0, 0, 0, 0);
        }
        query.orderDate.$gte = start;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        if (endTime) {
          const [hours, minutes] = endTime.split(':');
          end.setHours(parseInt(hours), parseInt(minutes), 59, 999);
        } else {
          end.setHours(23, 59, 59, 999);
        }
        query.orderDate.$lte = end;
      }
    }

    // Get total count
    const totalCount = await Order.countDocuments(query);

    // Get status counts
    const statusCounts = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get revenue from completed orders
    const revenueQuery = { ...query };
    if (!revenueQuery.status) {
      revenueQuery.status = { $in: ['completed', 'ready'] };
    }

    const revenueData = await Order.aggregate([
      { $match: revenueQuery },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      totalCount,
      pendingCount: statusCounts.find(s => s._id === 'pending')?.count || 0,
      preparingCount: statusCounts.find(s => s._id === 'preparing')?.count || 0,
      completedCount: statusCounts.find(s => s._id === 'completed')?.count || 0,
      totalRevenue: revenueData[0]?.totalRevenue || 0,
      avgOrderValue: revenueData[0]?.count > 0 ? revenueData[0].totalRevenue / revenueData[0].count : 0
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error fetching order statistics:', error);
    return { error: 'Failed to fetch statistics' };
  }
}

// Update order items
export async function updateOrderItems(orderId, updatedItems) {
  try {
    await connectDB();
    
    const order = await Order.findById(orderId);
    if (!order) return { error: 'Order not found' };
    
    if (order.status === 'completed' || order.status === 'cancelled') {
      return { error: 'Cannot edit completed or cancelled orders' };
    }

    const menuItemIds = updatedItems.map(item => item.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds }, isActive: true })
      .populate('categoryId', 'name icon color')
      .lean();

    if (menuItems.length !== menuItemIds.length) {
      return { error: 'Some menu items are no longer available' };
    }

    const itemsWithCost = updatedItems.map(item => {
      const menuItem = menuItems.find(mi => mi._id.toString() === item.menuItemId);
      return {
        ...item,
        costPrice: menuItem.costPrice,
        category: menuItem.categoryId?.name || 'Uncategorized',
        icon: menuItem.categoryId?.icon || (menuItem.icon || '🍽️')
      };
    });

    const subtotal = itemsWithCost.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * (order.taxPercentage / 100);
    const discount = (subtotal * order.discountPercentage) / 100;
    const total = subtotal + tax - discount + order.deliveryCharge;
    const totalCost = itemsWithCost.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
    const totalProfit = total - totalCost;

    order.items = itemsWithCost;
    order.subtotal = subtotal;
    order.tax = tax;
    order.total = total;
    order.totalCost = totalCost;
    order.totalProfit = totalProfit;

    await order.save();

    revalidatePath('/pos');
    revalidatePath('/orders');
    return { success: true, data: JSON.parse(JSON.stringify(order)) };
  } catch (error) {
    console.error('Error updating order items:', error);
    return { error: 'Failed to update order items' };
  }
}

// Update order status
export async function updateOrderStatus(orderId, status) {
  try {
    await connectDB();
    const order = await Order.findById(orderId);
    if (!order) return { error: 'Order not found' };

    order.status = status;
    if (status === 'completed') {
      order.completedAt = new Date();
      order.billPrintedAt = new Date();
    }
    await order.save();

    revalidatePath('/pos');
    revalidatePath('/orders');
    revalidatePath('/reports');
    return { success: true, data: JSON.parse(JSON.stringify(order)) };
  } catch (error) {
    console.error('Error updating order status:', error);
    return { error: 'Failed to update order status' };
  }
}

// Cancel order
export async function cancelOrder(orderId) {
  try {
    await connectDB();
    const order = await Order.findById(orderId);
    if (!order) return { error: 'Order not found' };
    if (order.status === 'completed') return { error: 'Cannot cancel completed order' };

    order.status = 'cancelled';
    await order.save();

    revalidatePath('/pos');
    revalidatePath('/orders');
    return { success: true, message: 'Order cancelled successfully' };
  } catch (error) {
    console.error('Error cancelling order:', error);
    return { error: 'Failed to cancel order' };
  }
}

// Complete order
export async function completeOrder(orderId, updatedDetails = null) {
  try {
    await connectDB();
    const order = await Order.findById(orderId);
    if (!order) return { error: 'Order not found' };

    if (updatedDetails) {
      if (updatedDetails.paymentMethod) order.paymentMethod = updatedDetails.paymentMethod.toLowerCase();
      if (updatedDetails.taxPercentage !== undefined) order.taxPercentage = updatedDetails.taxPercentage;
      if (updatedDetails.tax !== undefined) order.tax = updatedDetails.tax;
      if (updatedDetails.discountPercentage !== undefined) order.discountPercentage = updatedDetails.discountPercentage;
      if (updatedDetails.discount !== undefined) order.discount = updatedDetails.discount;
      if (updatedDetails.deliveryCharge !== undefined) order.deliveryCharge = updatedDetails.deliveryCharge;
      if (updatedDetails.subtotal !== undefined) order.subtotal = updatedDetails.subtotal;
      if (updatedDetails.total !== undefined) order.total = updatedDetails.total;
      if (updatedDetails.notes) order.notes = updatedDetails.notes;
      
      const totalCost = order.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
      order.totalProfit = updatedDetails.total - totalCost;
    }

    order.status = 'completed';
    order.completedAt = new Date();
    order.billPrintedAt = new Date();
    await order.save();

    revalidatePath('/pos');
    revalidatePath('/orders');
    revalidatePath('/reports');
    return { success: true, data: JSON.parse(JSON.stringify(order)) };
  } catch (error) {
    console.error('Error completing order:', error);
    return { error: 'Failed to complete order' };
  }
}

// Get pending orders
export async function getPendingOrders() {
  try {
    await connectDB();
    const orders = await Order.find({ status: { $in: ['pending', 'preparing', 'ready'] } })
      .sort({ createdAt: -1 })
      .lean();
    return { success: true, data: JSON.parse(JSON.stringify(orders)) };
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    return { error: 'Failed to fetch pending orders' };
  }
}

// Reprint KOT
export async function reprintKOT(orderId) {
  try {
    await connectDB();
    
    const order = await Order.findById(orderId).lean();
    if (!order) return { error: 'Order not found' };

    return { success: true, data: JSON.parse(JSON.stringify(order)) };
  } catch (error) {
    console.error('Error reprinting KOT:', error);
    return { error: 'Failed to reprint KOT' };
  }
}

// Legacy support - Get orders with filters
export async function getOrders(filters = {}) {
  try {
    await connectDB();
    const query = {};

    if (filters.status) query.status = filters.status;
    if (filters.orderType) query.orderType = filters.orderType;
    
    if (filters.startDate || filters.endDate) {
      query.orderDate = {};
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        if (filters.startTime) {
          const [hours, minutes] = filters.startTime.split(':');
          start.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        } else {
          start.setHours(0, 0, 0, 0);
        }
        query.orderDate.$gte = start;
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        if (filters.endTime) {
          const [hours, minutes] = filters.endTime.split(':');
          end.setHours(parseInt(hours), parseInt(minutes), 59, 999);
        } else {
          end.setHours(23, 59, 59, 999);
        }
        query.orderDate.$lte = end;
      }
    }

    const orders = await Order.find(query)
      .sort({ orderDate: -1, createdAt: -1 })
      .limit(filters.limit || 100)
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(orders)) };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { error: 'Failed to fetch orders' };
  }
}

// Get daily sales
export async function getDailySales(date = new Date()) {
  try {
    await connectDB();
    const stats = await Order.getDailySales(date);
    return { success: true, data: stats };
  } catch (error) {
    console.error('Error fetching daily sales:', error);
    return { error: 'Failed to fetch daily sales' };
  }
}

// Get popular items for a date range
export async function getPopularItemsForRange(startDate, endDate, limit = 10) {
  try {
    await connectDB();
    
    const items = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
          status: { $in: ['completed', 'ready'] }
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItemId',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: limit },
    ]);
    
    return { success: true, data: items };
  } catch (error) {
    console.error('Error fetching popular items for range:', error);
    return { error: 'Failed to fetch popular items' };
  }
}
// Get popular items
export async function getPopularItems(limit = 10) {
  try {
    await connectDB();
    
    // ✅ FIXED: Use aggregation with status filter
    const items = await Order.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'ready'] } // Only completed/ready orders
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItemId',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: limit },
    ]);
    
    return { success: true, data: items };
  } catch (error) {
    console.error('Error fetching popular items:', error);
    return { error: 'Failed to fetch popular items' };
  }
}

// Get sales for range
// Get sales for range
export async function getSalesForRange(startDate, endDate) {
  try {
    await connectDB();
    
    // ✅ FIXED: Add status filter to exclude cancelled orders
    const result = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
          status: { $in: ['completed', 'ready'] } // Only completed/ready orders
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
          revenue: { $sum: '$total' },
          cost: { $sum: '$totalCost' },
          profit: { $sum: '$totalProfit' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching sales range:', error);
    return { error: 'Failed to fetch sales range' };
  }
}

// Get sales summary
export async function getSalesSummary(startDate, endDate) {
  try {
    await connectDB();
    const result = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
          status: { $in: ['completed', 'ready'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalCost: { $sum: '$totalCost' },
          totalProfit: { $sum: '$totalProfit' },
          totalOrders: { $sum: 1 },
          totalItems: { $sum: { $sum: '$items.quantity' } },
          averageOrderValue: { $avg: '$total' },
          cashPayments: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'Cash'] }, '$total', 0] } },
          cardPayments: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'Card'] }, '$total', 0] } }
        }
      }
    ]);

    return {
      success: true,
      data: result[0] || {
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        totalOrders: 0,
        totalItems: 0,
        averageOrderValue: 0,
        cashPayments: 0,
        cardPayments: 0
      }
    };
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    return { error: 'Failed to fetch sales summary' };
  }
}

// Get all transactions
export async function getAllTransactions(filters = {}) {
  try {
    await connectDB();
    const query = { status: { $in: ['completed', 'ready'] } };

    if (filters.startDate || filters.endDate) {
      query.orderDate = {};
      if (filters.startDate) query.orderDate.$gte = new Date(filters.startDate);
      if (filters.endDate) query.orderDate.$lte = new Date(filters.endDate);
    }

    const transactions = await Order.find(query)
      .sort({ orderDate: -1 })
      .lean();

    const formatted = transactions.map(t => ({
      id: t.orderNumber,
      date: t.orderDate.toISOString().split('T')[0],
      time: new Date(t.orderDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      revenue: t.total,
      cost: t.totalCost,
      profit: t.totalProfit,
      paymentMethod: t.paymentMethod,
      items: t.items.reduce((sum, item) => sum + item.quantity, 0)
    }));

    return { success: true, data: formatted };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return { error: 'Failed to fetch transactions' };
  }
}