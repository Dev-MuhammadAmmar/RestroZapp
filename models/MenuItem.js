
// models/MenuItem.js
import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [100, 'Item name cannot exceed 100 characters'],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: [0, 'Cost price cannot be negative'],
    },
    profitMargin: {
      type: Number,
      required: [true, 'Profit margin is required'],
      min: [0, 'Profit margin cannot be negative'],
      max: [100, 'Profit margin cannot exceed 100%'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    preparationTime: {
      type: String,
      trim: true,
      maxlength: [50, 'Preparation time cannot exceed 50 characters'],
    },
      isPinned: {
    type: Boolean,
    default: false
  },
  pinnedAt: {
    type: Date,
    default: null
  }
  },
  {
    timestamps: true,
  }
);

menuItemSchema.index({ isActive: 1 });
menuItemSchema.index({ categoryId: 1 });

const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);

export default MenuItem;
