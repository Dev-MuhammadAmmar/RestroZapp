// models/GroceryPurchase.js
import mongoose from 'mongoose';

const GroceryPurchaseSchema = new mongoose.Schema(
  {
    // Item Information
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      index: true
    },
    category: {
      type: String,
      enum: [
        'General', 'Vegetables', 'Fruits', 'Meat', 
        'Dairy', 'Grains', 'Spices', 'Beverages', 
        'Cleaning', 'Other'
      ],
      default: 'General'
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative']
    },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'pcs', 'ltr', 'box', 'bag', 'dozen', 'gm', 'ml'],
      default: 'kg'
    },

    // Vendor Information
    vendorName: {
      type: String,
      required: [true, 'Vendor name is required'],
      trim: true,
      index: true
    },
    vendorContact: {
      type: String,
      trim: true
    },

    // Order Information
    orderedBy: {
      type: String,
      required: [true, 'Ordered by is required'],
      trim: true
    },
    orderedByRole: {
      type: String,
      enum: ['Owner', 'Manager', 'Rider', 'Staff'],
      default: 'Manager'
    },
    orderDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    deliveryDate: {
      type: Date
    },
    invoiceNumber: {
      type: String,
      trim: true,
      sparse: true,
      index: true
    },

    // Financial Information
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Amount cannot be negative'],
      default: 0
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative']
    },
    remainingAmount: {
      type: Number,
      default: 0,
      min: [0, 'Remaining amount cannot be negative']
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'CREDIT'],
      required: true,
      default: 'CASH'
    },
    creditStatus: {
      type: String,
      enum: ['PAID', 'UNPAID', 'N/A'],
      default: 'N/A'
    },
    lastPaymentDate: {
      type: Date
    },

    // Status
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED'],
      default: 'PENDING',
      index: true
    },
    completedDate: {
      type: Date
    },

    // Additional Information
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
GroceryPurchaseSchema.index({ vendorName: 1, orderDate: -1 });
GroceryPurchaseSchema.index({ status: 1, paymentMethod: 1 });
GroceryPurchaseSchema.index({ creditStatus: 1, paymentMethod: 1 });
GroceryPurchaseSchema.index({ category: 1, orderDate: -1 });

// Virtual for checking if item is overdue (for pending orders > 7 days)
GroceryPurchaseSchema.virtual('isOverdue').get(function() {
  if (this.status !== 'PENDING') return false;
  const daysSinceOrder = Math.floor((Date.now() - this.orderDate) / (1000 * 60 * 60 * 24));
  return daysSinceOrder > 7;
});

// Pre-save middleware to calculate remaining amount
GroceryPurchaseSchema.pre('save', function(next) {
  if (this.paymentMethod === 'CREDIT') {
    this.remainingAmount = this.totalAmount - (this.paidAmount || 0);
    this.creditStatus = this.remainingAmount <= 0 ? 'PAID' : 'UNPAID';
  } else {
    this.remainingAmount = 0;
    this.paidAmount = this.totalAmount;
    this.creditStatus = 'N/A';
  }
  next();
});

// Static method to get monthly spending
GroceryPurchaseSchema.statics.getMonthlySpending = async function(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  return await this.aggregate([
    {
      $match: {
        orderDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: '$totalAmount' },
        totalPurchases: { $sum: 1 },
        cashPurchases: {
          $sum: { $cond: [{ $eq: ['$paymentMethod', 'CASH'] }, 1, 0] }
        },
        creditPurchases: {
          $sum: { $cond: [{ $eq: ['$paymentMethod', 'CREDIT'] }, 1, 0] }
        }
      }
    }
  ]);
};

// Static method to get vendor performance
GroceryPurchaseSchema.statics.getVendorPerformance = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: '$vendorName',
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$totalAmount' },
        avgOrderValue: { $avg: '$totalAmount' },
        pendingCredit: {
          $sum: {
            $cond: [
              { $and: [
                { $eq: ['$paymentMethod', 'CREDIT'] },
                { $gt: ['$remainingAmount', 0] }
              ]},
              '$remainingAmount',
              0
            ]
          }
        },
        lastOrderDate: { $max: '$orderDate' }
      }
    },
    { $sort: { totalSpent: -1 } }
  ]);
};

const GroceryPurchase = mongoose.models.GroceryPurchase || 
  mongoose.model('GroceryPurchase', GroceryPurchaseSchema);

export default GroceryPurchase;