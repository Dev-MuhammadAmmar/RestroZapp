import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    restaurantName: {
      type: String,
      required: true,
      default: 'UNSA RESTAURANT',
    },
    address: {
      type: String,
      required: true,
      default: 'Allah Wala Chowk, Shikarpur',
    },
    phone1: {
      type: String,
      required: true,
      default: '0333-7275912',
    },
    phone2: {
      type: String,
      default: '0333-7265025',
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    taxPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    deliveryCharges: {
      type: Number,
      default: 0,
      min: 0,
    },
    footerMessage: {
      type: String,
      default: 'Thank You for Dining with Us!',
    },
  },
  {
    timestamps: true,
  }
);

// Create a single setting document on first run
settingSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      email: 'admin@restaurant.com',
      password: 'admin123', // Change this in production
    });
  }
  return settings;
};

const Setting = mongoose.models.Setting || mongoose.model('Setting', settingSchema);

export default Setting;