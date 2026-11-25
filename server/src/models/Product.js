const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema(
  {
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Bid amount must be positive'],
    },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
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
    pricingType: {
      type: String,
      enum: ['fixed', 'auction'],
      required: [true, 'Pricing type (fixed or auction) is required'],
    },
    // Fixed-price fields
    fixedPrice: {
      type: Number,
      min: [0, 'Fixed price cannot be negative'],
    },
    stockQuantity: {
      type: Number,
      min: [0, 'Stock cannot be negative'],
      default: 1,
    },
    // Auction fields
    startingPrice: {
      type: Number,
      min: [0, 'Starting price cannot be negative'],
    },
    currentBid: {
      type: Number,
      default: 0,
    },
    minBidIncrement: {
      type: Number,
      min: [1, 'Minimum bid increment must be at least 1'],
      default: 10,
    },
    auctionStartTime: {
      type: Date,
    },
    auctionEndTime: {
      type: Date,
    },
    highestBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    bids: [bidSchema],
    location: {
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
      enum: ['active', 'closed', 'sold'],
      default: 'active',
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

productSchema.pre('validate', function validatePricing(next) {
  if (this.pricingType === 'fixed') {
    if (this.fixedPrice === undefined || this.fixedPrice === null) {
      return next(new Error('Fixed price is required for fixed-price products'));
    }
  } else if (this.pricingType === 'auction') {
    if (this.startingPrice === undefined || this.startingPrice === null) {
      return next(new Error('Starting price is required for auction products'));
    }
    if (!this.auctionStartTime || !this.auctionEndTime) {
      return next(new Error('Auction start and end times are required for auction products'));
    }
    if (new Date(this.auctionEndTime) <= new Date(this.auctionStartTime)) {
      return next(new Error('Auction end time must be after start time'));
    }
  }
  return next();
});

productSchema.index({ title: 'text', category: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
