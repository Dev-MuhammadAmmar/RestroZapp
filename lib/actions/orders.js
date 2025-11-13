// lib/actions/orders.js
// ✅ FINAL FIXED VERSION - Generates order number before saving
'use server';

import connectDB from '../db';
import Order from '@/models/Order';
import MenuItem from '@/models/MenuItem';
import { revalidatePath } from 'next/cache';

// ✅ NEW: Function to generate order number
async function generateOrderNumber() {
  try {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Find the last order for today
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
    
    // Generate order number: YYYYMMDD-XXXX (e.g., 20241110-0001)
    const orderNumber = `${dateStr}-${sequence.toString().padStart(4, '0')}`;

    return orderNumber;
  } catch (error) {
    console.error('❌ Error generating order number:', error);
    // Fallback to timestamp-based order number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const fallbackNumber = `ORD-${timestamp}-${random}`;

    return fallbackNumber;
  }
}

export async function createOrder(orderData) {
  try {
    await connectDB();

    // Validate menu items, populate category info and get cost prices
    const menuItemIds = orderData.items.map(item => item.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds }, isActive: true })
      .populate('categoryId', 'name icon color')
      .lean();

    if (menuItems.length !== menuItemIds.length) {
      return { error: 'Some menu items are no longer available' };
    }

    // Add cost prices and required category field to items
    const itemsWithCost = orderData.items.map(item => {
      const menuItem = menuItems.find(mi => mi._id.toString() === item.menuItemId);
      return {
        ...item,
        costPrice: menuItem.costPrice,
        // Ensure category (string) is provided for Order schema
        category: menuItem.categoryId?.name || 'Uncategorized',
        // Use category icon if available
        icon: menuItem.categoryId?.icon || (menuItem.icon || '🍽️')
      };
    });

    // Calculate total cost and profit
    const totalCost = itemsWithCost.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
    const totalProfit = orderData.total - totalCost;

    // ✅ GENERATE ORDER NUMBER BEFORE CREATING ORDER
    const orderNumber = await generateOrderNumber();

    const order = new Order({
      orderNumber, // ✅ ADD THIS
      items: itemsWithCost,
      orderType: orderData.orderType,
      status: 'pending',
      subtotal: orderData.subtotal,
      tax: orderData.tax,
      taxPercentage: orderData.taxPercentage || 10,
      discount: orderData.discount || 0,
      discountPercentage: orderData.discountPercentage || 0,
      deliveryCharge: orderData.deliveryCharge || 0,
      total: orderData.total,
      totalCost,
      totalProfit,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: 'paid',
      customerName: orderData.customerName,
      phoneNumber: orderData.phoneNumber || null,
      tableNumber: orderData.tableNumber || null,
      address: orderData.address || null,
      notes: orderData.notes || null,
      kotPrintedAt: new Date()
    });

    await order.save();

    revalidatePath('/pos');
    revalidatePath('/orders');
    revalidatePath('/reports');
    return { success: true, data: JSON.parse(JSON.stringify(order)) };
  } catch (error) {
    console.error('Error creating order:', error);
    console.error('Error details:', error.message);
    return { error: error.message || 'Failed to create order' };
  }
}

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

export async function getOrders(filters = {}) {
  try {
    await connectDB();
    const query = {};

    if (filters.status) query.status = filters.status;
    if (filters.orderType) query.orderType = filters.orderType;
    if (filters.startDate || filters.endDate) {
      query.orderDate = {};
      if (filters.startDate) query.orderDate.$gte = new Date(filters.startDate);
      if (filters.endDate) query.orderDate.$lte = new Date(filters.endDate);
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit || 100)
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(orders)) };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { error: 'Failed to fetch orders' };
  }
}

export async function completeOrder(orderId) {
  try {
    await connectDB();
    const order = await Order.findById(orderId);
    if (!order) return { error: 'Order not found' };

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

export async function getPopularItems(limit = 10) {
  try {
    await connectDB();
    const items = await Order.getPopularItems(limit);
    return { success: true, data: items };
  } catch (error) {
    console.error('Error fetching popular items:', error);
    return { error: 'Failed to fetch popular items' };
  }
}

export async function getSalesForRange(startDate, endDate) {
  try {
    await connectDB();
    const result = await Order.getSalesForRange(startDate, endDate);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching sales range:', error);
    return { error: 'Failed to fetch sales range' };
  }
}

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

    // Transform to match reports format
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