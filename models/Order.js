// models/Order.js
// ✅ SIMPLIFIED VERSION - No pre-save middleware conflicts
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  icon: {
    type: String,
    default: '🍽️',
  },
  category: {
    type: String,
    required: true,
  },
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function(items) {
          return items && items.length > 0;
        },
        message: 'Order must contain at least one item',
      },
    },
    orderType: {
      type: String,
      required: true,
      enum: ['dine-in', 'takeaway', 'delivery'],
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    // Financial Details
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    taxPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    deliveryCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    // Cost and profit tracking
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    totalProfit: {
      type: Number,
      required: true,
    },
    // Payment Details
    paymentMethod: {
      type: String,
      required: true,
      enum: ['cash', 'card', 'online', 'other'],
      default: 'cash',
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ['pending', 'paid', 'refunded'],
      default: 'paid',
    },
    // Customer Details
    customerName: {
      type: String,
      required: true,
      trim: true,
      default: 'Guest',
    },
    phoneNumber: {
      type: String,
      trim: true,
      sparse: true,
    },
    tableNumber: {
      type: String,
      trim: true,
      default: null,
      sparse: true,
    },
    address: {
      type: String,
      trim: true,
      sparse: true,
    },
    // Timestamps
    orderDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    completedAt: {
      type: Date,
      sparse: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    kotPrintedAt: {
      type: Date,
      sparse: true,
    },
    billPrintedAt: {
      type: Date,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
orderSchema.index({ orderDate: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderType: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

// Static method to get daily sales
orderSchema.statics.getDailySales = async function(date = new Date()) {
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));
  
  const result = await this.aggregate([
    {
      $match: {
        orderDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['completed', 'ready'] },
      },
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$total' },
        totalCost: { $sum: '$totalCost' },
        totalProfit: { $sum: '$totalProfit' },
        totalOrders: { $sum: 1 },
        totalItems: { $sum: { $size: '$items' } },
      },
    },
  ]);
  
  return result[0] || { 
    totalSales: 0, 
    totalCost: 0, 
    totalProfit: 0, 
    totalOrders: 0, 
    totalItems: 0 
  };
};

// Static method to get sales for date range
orderSchema.statics.getSalesForRange = async function(startDate, endDate) {
  const result = await this.aggregate([
    {
      $match: {
        orderDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        status: { $in: ['completed', 'ready'] },
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
  
  return result;
};

// Static method to get popular items
orderSchema.statics.getPopularItems = async function(limit = 10) {
  const result = await this.aggregate([
    {
      $match: {
        status: { $in: ['completed', 'ready'] },
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
  
  return result;
};

// Prevent model overwrite during hot reload in development
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;