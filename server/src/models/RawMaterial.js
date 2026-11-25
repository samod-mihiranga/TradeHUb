const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Material title is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    pricePerUnit: {
      type: Number,
      required: [true, 'Price per unit is required'],
      min: [0, 'Price cannot be negative'],
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
      default: 'kg',
    },
    minOrderQuantity: {
      type: Number,
      required: true,
      min: [1, 'Minimum order quantity must be at least 1'],
      default: 1,
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: [0, 'Available quantity cannot be negative'],
      default: 0,
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    specifications: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['available', 'out_of_stock', 'archived'],
      default: 'available',
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

rawMaterialSchema.index({ title: 'text', category: 'text', description: 'text' });

module.exports = mongoose.model('RawMaterial', rawMaterialSchema);
