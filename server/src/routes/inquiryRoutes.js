const express = require('express');
const Inquiry = require('../models/Inquiry');
const RawMaterial = require('../models/RawMaterial');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/inquiries (list inquiries for the logged-in customer or supplier)
router.get('/', protect, async (req, res) => {
  try {
    const query =
      req.user.role === 'raw_material_supplier' || req.user.role === 'product_supplier'
        ? { supplier: req.user._id }
        : { customer: req.user._id };

    const inquiries = await Inquiry.find(query)
      .populate('rawMaterial', 'title category pricePerUnit unit')
      .populate('product', 'title category pricingType fixedPrice currentBid startingPrice')
      .populate('customer', 'name email companyName phone')
      .populate('supplier', 'name email companyName phone')
      .populate('messages.sender', 'name role')
      .sort({ updatedAt: -1 });

    return res.json(inquiries);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch inquiries' });
  }
});

// POST /api/inquiries (customers initiate contact with raw material or product suppliers)
router.post(
  '/',
  protect,
  authorize('raw_material_customer', 'product_customer'),
  async (req, res) => {
    try {
      const { itemType, itemId, subject, message } = req.body;

      if (!itemType || !itemId || !subject || !message) {
        return res.status(400).json({
          message: 'itemType, itemId, subject, and message are required',
        });
      }

      let supplierId = null;
      let rawMaterialId = null;
      let productId = null;

      if (itemType === 'raw_material') {
        if (req.user.role !== 'raw_material_customer') {
          return res.status(403).json({
            message: 'Only raw material customers can contact raw material suppliers',
          });
        }
        const material = await RawMaterial.findById(itemId);
        if (!material) {
          return res.status(404).json({ message: 'Raw material not found' });
        }
        supplierId = material.supplier;
        rawMaterialId = material._id;
      } else if (itemType === 'product') {
        if (req.user.role !== 'product_customer') {
          return res.status(403).json({
            message: 'Only product customers can contact product suppliers',
          });
        }
        const product = await Product.findById(itemId);
        if (!product) {
          return res.status(404).json({ message: 'Product not found' });
        }
        supplierId = product.supplier;
        productId = product._id;
      } else {
        return res.status(400).json({ message: 'Invalid itemType. Use raw_material or product.' });
      }

      const inquiry = await Inquiry.create({
        itemType,
        rawMaterial: rawMaterialId,
        product: productId,
        customer: req.user._id,
        supplier: supplierId,
        subject: subject.trim(),
        messages: [{ sender: req.user._id, text: message.trim() }],
        status: 'open',
      });

      const populated = await Inquiry.findById(inquiry._id)
        .populate('rawMaterial', 'title category pricePerUnit unit')
        .populate('product', 'title category pricingType fixedPrice currentBid')
        .populate('customer', 'name email companyName phone')
        .populate('supplier', 'name email companyName phone')
        .populate('messages.sender', 'name role');

      return res.status(201).json(populated);
    } catch (error) {
      return res.status(500).json({ message: error.message || 'Failed to send inquiry' });
    }
  }
);

// POST /api/inquiries/:id/reply (either participant replies)
router.post('/:id/reply', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Reply message cannot be empty' });
    }

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    const userId = req.user._id.toString();
    const isParticipant =
      inquiry.customer.toString() === userId || inquiry.supplier.toString() === userId;

    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not a participant in this inquiry' });
    }

    inquiry.messages.push({ sender: req.user._id, text: text.trim() });
    if (inquiry.supplier.toString() === userId && inquiry.status === 'open') {
      inquiry.status = 'replied';
    }
    await inquiry.save();

    const populated = await Inquiry.findById(inquiry._id)
      .populate('rawMaterial', 'title category pricePerUnit unit')
      .populate('product', 'title category pricingType fixedPrice currentBid')
      .populate('customer', 'name email companyName phone')
      .populate('supplier', 'name email companyName phone')
      .populate('messages.sender', 'name role');

    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to send reply' });
  }
});

// PATCH /api/inquiries/:id/status
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['open', 'replied', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    const userId = req.user._id.toString();
    if (inquiry.customer.toString() !== userId && inquiry.supplier.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this inquiry' });
    }

    inquiry.status = status;
    await inquiry.save();
    return res.json(inquiry);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update inquiry status' });
  }
});

module.exports = router;
