// models/Customer.js
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
      index: true, // Index for faster name searches
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      index: true, // Unique index for phone lookups
      validate: {
        validator: function(v) {
          // Basic phone validation - adjust regex as needed
          return /^[0-9+\-\s()]{7,20}$/.test(v);
        },
        message: 'Please provide a valid phone number'
      }
    },
    address: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Address cannot exceed 500 characters'],
    },
    email: {
      type: String,
      trim: true,
      sparse: true, // Allows multiple null values
      lowercase: true,
      validate: {
        validator: function(v) {
          if (!v) return true; // Email is optional
          return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
        },
        message: 'Please provide a valid email address'
      }
    },
    orderCount: {
      type: Number,
      default: 1,
      min: [0, 'Order count cannot be negative'],
      index: true, // Index for sorting by order count
    },
    lastOrderDate: {
      type: Date,
      default: Date.now,
      index: true, // Index for recent customer queries
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: [0, 'Total spent cannot be negative'],
      index: true, // Index for VIP customer queries
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Compound indexes for optimized queries
customerSchema.index({ name: 1, phoneNumber: 1 }); // For combined searches
customerSchema.index({ orderCount: -1, lastOrderDate: -1 }); // For sorting top customers
customerSchema.index({ totalSpent: -1, orderCount: -1 }); // For VIP queries

// Text index for full-text search (optional - only if needed)
// customerSchema.index({ name: 'text', phoneNumber: 'text' });

// Virtual for customer tier
customerSchema.virtual('tier').get(function() {
  if (this.totalSpent >= 50000) return 'VIP';
  if (this.totalSpent >= 20000) return 'Gold';
  if (this.totalSpent >= 10000) return 'Silver';
  return 'Regular';
});

// Instance method to check if customer is returning
customerSchema.methods.isReturningCustomer = function() {
  return this.orderCount > 1;
};

// Instance method to check if customer is recent
customerSchema.methods.isRecentCustomer = function(days = 30) {
  if (!this.lastOrderDate) return false;
  const daysSinceLastOrder = (Date.now() - this.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceLastOrder <= days;
};

// Static method to get customer statistics
customerSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: null,
        totalCustomers: { $sum: 1 },
        totalRevenue: { $sum: '$totalSpent' },
        averageOrdersPerCustomer: { $avg: '$orderCount' },
        averageSpendPerCustomer: { $avg: '$totalSpent' },
      }
    }
  ]);
  
  return stats[0] || {
    totalCustomers: 0,
    totalRevenue: 0,
    averageOrdersPerCustomer: 0,
    averageSpendPerCustomer: 0,
  };
};

// Static method to get top customers
customerSchema.statics.getTopCustomers = async function(limit = 10) {
  return this.find({ isActive: true })
    .select('name phoneNumber orderCount totalSpent lastOrderDate')
    .sort({ totalSpent: -1, orderCount: -1 })
    .limit(limit)
    .lean();
};

// Pre-save hook to format phone number (optional)
customerSchema.pre('save', function(next) {
  // Normalize phone number format if needed
  if (this.phoneNumber) {
    this.phoneNumber = this.phoneNumber.trim().replace(/\s+/g, '');
  }
  next();
});

// Ensure indexes are created
customerSchema.post('init', function() {
  this.constructor.createIndexes();
});

// Prevent model overwrite during hot reload
const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);

export default Customer;