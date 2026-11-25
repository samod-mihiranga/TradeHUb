const express = require('express');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/products (public browsing with search, category, pricingType filter)
router.get('/', async (req, res) => {
  try {
    const { search, category, pricingType, status } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (pricingType && ['fixed', 'auction'].includes(pricingType)) {
      filter.pricingType = pricingType;
    }

    if (category && category !== 'all') {
      filter.category = new RegExp(`^${category.trim()}$`, 'i');
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: regex },
        { category: regex },
        { description: regex },
        { location: regex },
      ];
    }

    const products = await Product.find(filter)
      .populate('supplier', 'name companyName email phone location')
      .populate('highestBidder', 'name email')
      .sort({ createdAt: -1 });

    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch products' });
  }
});

// GET /api/products/mine (product supplier's own listings)
router.get('/mine', protect, authorize('product_supplier'), async (req, res) => {
  try {
    const products = await Product.find({ supplier: req.user._id })
      .populate('highestBidder', 'name email')
      .sort({ createdAt: -1 });
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to load your products' });
  }
});

// GET /api/products/my-bids (product customer's bid history)
router.get('/my-bids', protect, authorize('product_customer'), async (req, res) => {
  try {
    const products = await Product.find({ 'bids.bidder': req.user._id })
      .populate('supplier', 'name companyName email')
      .populate('highestBidder', 'name email')
      .sort({ auctionEndTime: 1 });
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to load your bids' });
  }
});

// GET /api/products/my-orders (product customer's & supplier's orders)
router.get('/my-orders', protect, authorize('product_customer', 'product_supplier'), async (req, res) => {
  try {
    const query =
      req.user.role === 'product_supplier'
        ? { supplier: req.user._id }
        : { buyer: req.user._id };

    const orders = await Order.find(query)
      .populate('product', 'title category pricingType imageUrl')
      .populate('buyer', 'name email phone')
      .populate('supplier', 'name companyName email')
      .sort({ createdAt: -1 });

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to load orders' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('supplier', 'name companyName email phone location')
      .populate('highestBidder', 'name email')
      .populate('bids.bidder', 'name email');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch product' });
  }
});

// POST /api/products (product_supplier only — fixed price or auction)
router.post('/', protect, authorize('product_supplier'), async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      pricingType,
      fixedPrice,
      stockQuantity,
      startingPrice,
      minBidIncrement,
      auctionStartTime,
      auctionEndTime,
      location,
      imageUrl,
    } = req.body;

    const payload = {
      title,
      category,
      description,
      pricingType,
      location: location || req.user.location || '',
      imageUrl: imageUrl || '',
      supplier: req.user._id,
    };

    if (pricingType === 'fixed') {
      payload.fixedPrice = Number(fixedPrice);
      payload.stockQuantity = Number(stockQuantity) || 1;
    } else if (pricingType === 'auction') {
      payload.startingPrice = Number(startingPrice);
      payload.currentBid = 0;
      payload.minBidIncrement = Number(minBidIncrement) || 10;
      payload.auctionStartTime = auctionStartTime ? new Date(auctionStartTime) : new Date();
      payload.auctionEndTime = new Date(auctionEndTime);
      payload.stockQuantity = 1;
    }

    const product = await Product.create(payload);
    const populated = await product.populate('supplier', 'name companyName email phone location');
    return res.status(201).json(populated);
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Failed to create product' });
  }
});

// PUT /api/products/:id (owner supplier only)
router.put('/:id', protect, authorize('product_supplier'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.supplier.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own products' });
    }

    const allowedFields = [
      'title',
      'category',
      'description',
      'fixedPrice',
      'stockQuantity',
      'minBidIncrement',
      'auctionEndTime',
      'location',
      'imageUrl',
      'status',
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();
    return res.json(product);
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Failed to update product' });
  }
});

// DELETE /api/products/:id (owner supplier only)
router.delete('/:id', protect, authorize('product_supplier'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.supplier.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own products' });
    }

    await product.deleteOne();
    return res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to delete product' });
  }
});

// POST /api/products/:id/bid (product_customer only + real-time Socket.IO broadcast)
router.post('/:id/bid', protect, authorize('product_customer'), async (req, res) => {
  try {
    const bidAmount = Number(req.body.amount);
    if (Number.isNaN(bidAmount) || bidAmount <= 0) {
      return res.status(400).json({ message: 'Please enter a valid positive bid amount' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.pricingType !== 'auction') {
      return res.status(400).json({ message: 'This product is fixed-price and does not accept bids' });
    }

    if (product.status !== 'active') {
      return res.status(400).json({ message: 'This auction is no longer active' });
    }

    const now = new Date();
    if (product.auctionStartTime && now < new Date(product.auctionStartTime)) {
      return res.status(400).json({ message: 'This auction has not started yet' });
    }
    if (product.auctionEndTime && now > new Date(product.auctionEndTime)) {
      product.status = 'closed';
      await product.save();
      return res.status(400).json({ message: 'This auction has already ended' });
    }

    const minAllowed =
      product.currentBid > 0
        ? product.currentBid + (product.minBidIncrement || 1)
        : product.startingPrice;

    if (bidAmount < minAllowed) {
      return res.status(400).json({
        message: `Bid must be at least $${minAllowed.toFixed(2)}`,
      });
    }

    product.currentBid = bidAmount;
    product.highestBidder = req.user._id;
    product.bids.unshift({
      bidder: req.user._id,
      amount: bidAmount,
    });

    await product.save();

    const updated = await Product.findById(product._id)
      .populate('supplier', 'name companyName email phone location')
      .populate('highestBidder', 'name email')
      .populate('bids.bidder', 'name email');

    // Broadcast live bid update over Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`product_${product._id}`).emit('bid_updated', updated);
      io.emit('product_bid_summary', {
        productId: product._id.toString(),
        currentBid: updated.currentBid,
        bidCount: updated.bids.length,
        highestBidder: updated.highestBidder,
      });
    }

    return res.status(201).json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to place bid' });
  }
});

// POST /api/products/:id/order (legacy direct order endpoint)
router.post('/:id/order', protect, authorize('product_customer'), async (req, res) => {
  try {
    const { quantity = 1, shippingAddress, notes = '' } = req.body;
    const qty = Number(quantity);

    if (!shippingAddress || !shippingAddress.trim()) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }
    if (Number.isNaN(qty) || qty < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.pricingType !== 'fixed') {
      return res.status(400).json({ message: 'Direct orders are only available for fixed-price products' });
    }
    if (product.status !== 'active' || product.stockQuantity < qty) {
      return res.status(400).json({ message: 'Insufficient stock available' });
    }

    product.stockQuantity -= qty;
    if (product.stockQuantity === 0) {
      product.status = 'sold';
    }
    await product.save();

    const order = await Order.create({
      product: product._id,
      buyer: req.user._id,
      supplier: product.supplier,
      orderType: 'fixed',
      quantity: qty,
      unitPrice: product.fixedPrice,
      totalPrice: product.fixedPrice * qty,
      shippingAddress: shippingAddress.trim(),
      notes: notes.trim(),
      paymentStatus: 'paid',
      status: 'confirmed',
      paidAt: new Date(),
    });

    return res.status(201).json(order);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to place order' });
  }
});

module.exports = router;
