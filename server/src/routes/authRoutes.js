const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'dev_jwt_secret_change_me', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  companyName: user.companyName,
  phone: user.phone,
  location: user.location,
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, companyName, phone, location } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }

    if (!User.USER_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid user role selected' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      companyName: companyName || '',
      phone: phone || '',
      location: location || '',
    });

    return res.status(201).json({
      token: generateToken(user._id),
      user: formatUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.json({
      token: generateToken(user._id),
      user: formatUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  return res.json({ user: formatUser(req.user) });
});

module.exports = router;
