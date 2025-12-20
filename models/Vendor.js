import mongoose from 'mongoose';

const VendorSchema = new mongoose.Schema(
  {
    vendorName: {
      type: String,
      required: [true, 'Vendor name is required'],
      trim: true,
      unique: true,
      index: true
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true
    },
    
    // Auto-calculated stats (don't manually enter these)
    totalOrders: {
      type: Number,
      default: 0
    },
    totalPurchaseValue: {
      type: Number,
      default: 0
    },
    totalPaid: {
      type: Number,
      default: 0
    },
    totalPending: {
      type: Number,
      default: 0
    },
    lastOrderDate: {
      type: Date
    },
    
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast searching
VendorSchema.index({ vendorName: 'text', phoneNumber: 'text' });
VendorSchema.index({ createdAt: -1 });

const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema);

export default Vendor;