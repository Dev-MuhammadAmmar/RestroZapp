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
        'Vegetables', 'Fruits', 'Meat & Poultry', 'Seafood',
        'Dairy & Eggs', 'Grains & Cereals', 'Spices & Condiments', 
        'Beverages', 'Bakery', 'Frozen Foods', 'Cooking Oil',
        'Cleaning Supplies', 'Disposables', 'Other'
      ],
      default: 'Other',
      index: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.01, 'Quantity must be greater than 0']
    },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'pcs', 'ltr', 'box', 'bag', 'dozen', 'gm', 'ml', 'packet', 'carton'],
      default: 'kg'
    },
    unitPrice: {
      type: Number,
      min: [0, 'Unit price cannot be negative'],
      default: 0
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
      trim: true,
      index: true
    },
    orderedByRole: {
      type: String,
      enum: ['Owner', 'Manager', 'Chef', 'Supervisor', 'Staff'],
      default: 'Manager'
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
  default: function() {
    return this.totalAmount || 0;
  },
  min: [0, 'Remaining amount cannot be negative'],
  index: true  // Add index for better query performance
},
    paymentMethod: {
      type: String,
      enum: ['CASH', 'CREDIT', 'BANK_TRANSFER', 'CHEQUE'],
      required: true,
      default: 'CASH'
    },
    creditStatus: {
      type: String,
      enum: ['PAID', 'PARTIAL', 'UNPAID', 'N/A'],
      default: 'N/A',
      index: true
    },
    paymentHistory: [{
      amount: Number,
      date: { type: Date, default: Date.now },
      method: String,
      note: String,
      paidBy: String 
    }],

    // Status & Tracking
    status: {
      type: String,
      enum: ['PENDING', 'RECEIVED', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },

    // Additional Information
    notes: {
      type: String,
      trim: true
    },

    // Tracking
    isArchived: {
      type: Boolean,
      default: false,
      index: true
    },
    returnedQuantity: {
  type: Number,
  default: 0,
  min: [0, 'Returned quantity cannot be negative']
},
returns: [{
  originalPurchaseId: mongoose.Schema.Types.ObjectId,
  itemName: String,
  category: String,
  returnQuantity: Number,
  unit: String,
  unitPrice: Number,
  returnAmount: Number,
  vendorName: String,
  returnReason: String,
  returnNotes: String,
  returnDate: { type: Date, default: Date.now }
}]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound Indexes for complex queries
GroceryPurchaseSchema.index({ vendorName: 1, createdAt: -1 });
GroceryPurchaseSchema.index({ status: 1, paymentMethod: 1 });
GroceryPurchaseSchema.index({ creditStatus: 1, paymentMethod: 1 });
GroceryPurchaseSchema.index({ isArchived: 1, createdAt: -1 });
GroceryPurchaseSchema.index({ itemName: 'text', vendorName: 'text', notes: 'text' });

// Pre-save middleware
// Pre-save middleware
GroceryPurchaseSchema.pre('save', function(next) {
  // Calculate unit price if not set and totalAmount exists
  if (this.quantity && this.totalAmount && !this.unitPrice) {
    this.unitPrice = this.totalAmount / this.quantity;
  }

  // Handle credit calculations - CRITICAL FIX
  if (this.paymentMethod === 'CREDIT' || this.paymentMethod === 'BANK_TRANSFER') {
    // Ensure paidAmount is a number
    const paidAmt = Number(this.paidAmount) || 0;
    const totalAmt = Number(this.totalAmount) || 0;
    
    // EXPLICITLY set remainingAmount
    this.remainingAmount = Math.max(0, totalAmt - paidAmt);
    
    // Update credit status
    if (this.remainingAmount <= 0.01) { // Allow small rounding errors
      this.creditStatus = 'PAID';
      this.remainingAmount = 0;
    } else if (paidAmt > 0) {
      this.creditStatus = 'PARTIAL';
    } else {
      this.creditStatus = 'UNPAID';
    }
  } else {
    // For CASH payments
    this.remainingAmount = 0;
    this.paidAmount = this.totalAmount;
    this.creditStatus = 'N/A';
  }

  // Auto-complete if fully paid and received
  if (this.creditStatus === 'PAID' && this.status === 'RECEIVED') {
    this.status = 'COMPLETED';
  }

  // Mark remainingAmount as modified to ensure it saves
  this.markModified('remainingAmount');
  this.markModified('creditStatus');

  next();
});
const GroceryPurchase = mongoose.models.GroceryPurchase || 
  mongoose.model('GroceryPurchase', GroceryPurchaseSchema);

export default GroceryPurchase;