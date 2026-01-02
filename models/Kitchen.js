// models/Kitchen.js
import mongoose from 'mongoose';

const kitchenSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Kitchen name is required'],
      trim: true,
      unique: true,
      maxlength: [100, 'Kitchen name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    menuItems: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      required: [true, 'Kitchen color is required'],
      default: '#10b981',
      match: [/^#[0-9A-Fa-f]{6}$/, 'Please provide a valid hex color'],
    },
    icon: {
      type: String,
      default: '🍳',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
kitchenSchema.index({ isActive: 1 });
kitchenSchema.index({ displayOrder: 1 });
kitchenSchema.index({ name: 1 });

// Virtual for item count
kitchenSchema.virtual('itemCount').get(function() {
  return this.menuItems ? this.menuItems.length : 0;
});

// Ensure virtuals are included in JSON
kitchenSchema.set('toJSON', { virtuals: true });
kitchenSchema.set('toObject', { virtuals: true });

const Kitchen = mongoose.models.Kitchen || mongoose.model('Kitchen', kitchenSchema);

export default Kitchen;