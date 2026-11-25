const express = require('express');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const getStripeClient = () => {
  const key = (process.env.STRIPE_SECRET_KEY || '').trim();
  if (!key) return null;
  const Stripe = require('stripe');
  return new Stripe(key);
};

// GET /api/payments/config — tells frontend whether real Stripe or built-in Test Gateway is active
router.get('/config', (req, res) => {
  const hasStripe = Boolean((process.env.STRIPE_SECRET_KEY || '').trim());
  return res.json({
    provider: hasStripe ? 'stripe' : 'demo_card',
    stripeConfigured: hasStripe,
  });
});

// POST /api/payments/checkout — starts payment for fixed-price product or won auction
router.post('/checkout', protect, authorize('product_customer'), async (req, res) => {
  try {
    const { productId, quantity = 1, shippingAddress, notes = '' } = req.body;
    const qty = Number(quantity) || 1;

    if (!productId || !shippingAddress || !shippingAddress.trim()) {
      return res.status(400).json({ message: 'Product ID and shipping address are required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let unitPrice = 0;
    let finalQty = qty;
    let orderType = product.pricingType;

    if (product.pricingType === 'fixed') {
      if (product.status !== 'active' || product.stockQuantity < qty) {
        return res.status(400).json({ message: 'Insufficient stock available' });
      }
      unitPrice = product.fixedPrice;
    } else {
      // Auction winner payment
      const now = new Date();
      const auctionEnded = product.auctionEndTime && now >= new Date(product.auctionEndTime);
      if (!auctionEnded && product.status === 'active') {
        return res.status(400).json({ message: 'Auction is still active. Wait until it ends to pay.' });
      }
      if (!product.highestBidder || product.highestBidder.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Only the winning bidder can pay for this auction' });
      }
      if (product.status === 'sold') {
        return res.status(400).json({ message: 'This auction has already been paid for' });
      }
      unitPrice = product.currentBid;
      finalQty = 1;
    }

    const totalPrice = Number((unitPrice * finalQty).toFixed(2));
    const stripe = getStripeClient();
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const order = await Order.create({
      product: product._id,
      buyer: req.user._id,
      supplier: product.supplier,
      orderType,
      quantity: finalQty,
      unitPrice,
      totalPrice,
      shippingAddress: shippingAddress.trim(),
      notes: notes.trim(),
      paymentStatus: 'pending',
      paymentMethod: stripe ? 'stripe' : 'demo_card',
      status: 'pending',
    });

    if (stripe) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: req.user.email,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: product.title,
                description: `${product.category} (${orderType === 'auction' ? 'Winning Auction Bid' : 'Fixed Price'})`,
              },
              unit_amount: Math.round(unitPrice * 100),
            },
            quantity: finalQty,
          },
        ],
        metadata: {
          orderId: order._id.toString(),
          productId: product._id.toString(),
        },
        success_url: `${clientUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order._id}`,
        cancel_url: `${clientUrl}/products/${product._id}?payment=cancelled`,
      });

      order.stripeSessionId = session.id;
      await order.save();

      return res.status(201).json({
        mode: 'stripe',
        checkoutUrl: session.url,
        orderId: order._id,
      });
    }

    // No STRIPE_SECRET_KEY configured: return pending order for built-in Test Card Gateway modal
    return res.status(201).json({
      mode: 'demo_card',
      orderId: order._id,
      totalPrice: order.totalPrice,
      productTitle: product.title,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Payment checkout failed' });
  }
});

// Helper to finalize order and deduct stock
const finalizePaidOrder = async (order) => {
  if (order.paymentStatus === 'paid') return order;

  const product = await Product.findById(order.product);
  if (product) {
    if (product.pricingType === 'fixed') {
      product.stockQuantity = Math.max(0, product.stockQuantity - order.quantity);
      if (product.stockQuantity === 0) product.status = 'sold';
    } else {
      product.status = 'sold';
    }
    await product.save();
  }

  order.paymentStatus = 'paid';
  order.status = 'confirmed';
  order.paidAt = new Date();
  await order.save();
  return order;
};

// POST /api/payments/demo-pay/:orderId — completes simulated test card payment
router.post('/demo-pay/:orderId', protect, authorize('product_customer'), async (req, res) => {
  try {
    const { cardHolder, cardLast4 } = req.body;
    if (!cardHolder || !cardHolder.trim()) {
      return res.status(400).json({ message: 'Cardholder name is required' });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to pay this order' });
    }

    order.notes = [order.notes, `Paid via Test Card ending in ${cardLast4 || '4242'} (${cardHolder.trim()})`]
      .filter(Boolean)
      .join(' | ');
    await finalizePaidOrder(order);

    const populated = await Order.findById(order._id)
      .populate('product', 'title category pricingType imageUrl')
      .populate('supplier', 'name companyName email');

    return res.json({ message: 'Payment successful', order: populated });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Test payment failed' });
  }
});

// GET /api/payments/verify-session/:sessionId — verifies Stripe Checkout redirect
router.get('/verify-session/:sessionId', protect, async (req, res) => {
  try {
    const stripe = getStripeClient();
    const order = await Order.findOne({ stripeSessionId: req.params.sessionId })
      .populate('product', 'title category pricingType imageUrl')
      .populate('supplier', 'name companyName email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found for this payment session' });
    }

    if (stripe && order.paymentStatus !== 'paid') {
      const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
      if (session.payment_status === 'paid') {
        await finalizePaidOrder(order);
      }
    }

    return res.json({ order });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to verify payment session' });
  }
});

// GET /api/payments/order/:orderId
router.get('/order/:orderId', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('product', 'title category pricingType imageUrl')
      .populate('supplier', 'name companyName email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    return res.json({ order });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch order' });
  }
});

module.exports = router;
