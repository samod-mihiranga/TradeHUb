const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// POST /api/upload (suppliers upload product or raw material images)
router.post(
  '/',
  protect,
  authorize('raw_material_supplier', 'product_supplier'),
  (req, res) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message || 'Image upload failed' });
      }
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }
      return res.status(201).json({
        imageUrl: `/uploads/${req.file.filename}`,
        filename: req.file.filename,
      });
    });
  }
);

module.exports = router;
