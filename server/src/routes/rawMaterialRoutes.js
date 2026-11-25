const express = require('express');
const RawMaterial = require('../models/RawMaterial');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/raw-materials (public browsing with search & category filter)
router.get('/', async (req, res) => {
  try {
    const { search, category, status } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: 'archived' };
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

    const materials = await RawMaterial.find(filter)
      .populate('supplier', 'name companyName email phone location')
      .sort({ createdAt: -1 });

    return res.json(materials);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch raw materials' });
  }
});

// GET /api/raw-materials/mine (supplier's own listings)
router.get('/mine', protect, authorize('raw_material_supplier'), async (req, res) => {
  try {
    const materials = await RawMaterial.find({ supplier: req.user._id }).sort({ createdAt: -1 });
    return res.json(materials);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to load your raw materials' });
  }
});

// GET /api/raw-materials/:id
router.get('/:id', async (req, res) => {
  try {
    const material = await RawMaterial.findById(req.params.id).populate(
      'supplier',
      'name companyName email phone location'
    );
    if (!material) {
      return res.status(404).json({ message: 'Raw material not found' });
    }
    return res.json(material);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch raw material' });
  }
});

// POST /api/raw-materials (raw_material_supplier only)
router.post('/', protect, authorize('raw_material_supplier'), async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      pricePerUnit,
      unit,
      minOrderQuantity,
      availableQuantity,
      location,
      specifications,
      imageUrl,
    } = req.body;

    const material = await RawMaterial.create({
      title,
      category,
      description,
      pricePerUnit: Number(pricePerUnit),
      unit: unit || 'kg',
      minOrderQuantity: Number(minOrderQuantity) || 1,
      availableQuantity: Number(availableQuantity) || 0,
      location: location || req.user.location || '',
      specifications: specifications || '',
      imageUrl: imageUrl || '',
      supplier: req.user._id,
    });

    const populated = await material.populate('supplier', 'name companyName email phone location');
    return res.status(201).json(populated);
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Failed to create raw material' });
  }
});

// PUT /api/raw-materials/:id (owner supplier only)
router.put('/:id', protect, authorize('raw_material_supplier'), async (req, res) => {
  try {
    const material = await RawMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Raw material not found' });
    }
    if (material.supplier.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own raw materials' });
    }

    const allowedFields = [
      'title',
      'category',
      'description',
      'pricePerUnit',
      'unit',
      'minOrderQuantity',
      'availableQuantity',
      'location',
      'specifications',
      'imageUrl',
      'status',
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        material[field] = req.body[field];
      }
    });

    await material.save();
    return res.json(material);
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Failed to update raw material' });
  }
});

// DELETE /api/raw-materials/:id (owner supplier only)
router.delete('/:id', protect, authorize('raw_material_supplier'), async (req, res) => {
  try {
    const material = await RawMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Raw material not found' });
    }
    if (material.supplier.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own raw materials' });
    }

    await material.deleteOne();
    return res.json({ message: 'Raw material deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to delete raw material' });
  }
});

module.exports = router;
