// models/Category.js
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    icon: {
      type: String,
      required: [true, 'Category icon is required'],
      default: '🍽️',
    },
    color: {
      type: String,
      required: [true, 'Category color is required'],
      default: '#10b981',
      match: [/^#[0-9A-Fa-f]{6}$/, 'Please provide a valid hex color'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.index({ isActive: 1 });

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

export default Category;
