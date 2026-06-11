import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    if (!user.isActive && user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Account suspended. Contact support.' });
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        houseName: user.role === 'caretaker' ? (await import('../models/User.js')).default.findById(user.ownerId).then(o=>o?.houseName||'') : user.houseName,
        caretakerName: user.caretakerName,
        isActive: user.isActive,
        ownerId: user.ownerId || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Superadmin creates a new admin house account
export const createAdminAccount = async (req, res) => {
  try {
    const { email, password, houseName, caretakerName, caretakerPhone, pricePerRoom } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const user = await User.create({
      email,
      password,
      role: 'admin',
      houseName: houseName || '',
      caretakerName: caretakerName || '',
      caretakerPhone: caretakerPhone || '',
      pricePerRoom: pricePerRoom || 50,
      isActive: true
    });

    res.status(201).json({ user });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Failed to create admin account' });
  }
};

export const getMe = async (req, res) => {
  res.json({ user: req.user });
};

// GET + SAVE message template
export const getTemplate = async (req, res) => {
  res.json({ template: req.user.messageTemplate || '' });
};

export const saveTemplate = async (req, res) => {
  try {
    const { template } = req.body;
    await (await import('../models/User.js')).default.findByIdAndUpdate(
      req.user._id,
      { $set: { messageTemplate: template || '' } }
    );
    res.json({ message: 'Template saved' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save template' });
  }
};

// ── Caretaker management (admin only) ────────────────────────────

// GET all caretakers for this admin
export const getCaretakers = async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const caretakers = await User.find({
      ownerId: req.user._id,
      role: 'caretaker',
      isDeleted: false
    }).sort({ createdAt: -1 });
    res.json({ caretakers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch caretakers' });
  }
};

// POST create a caretaker account
export const createCaretaker = async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const { email, password, caretakerName, caretakerPhone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const caretaker = await User.create({
      email,
      password,
      role: 'caretaker',
      ownerId: req.user._id,
      caretakerName: caretakerName || '',
      caretakerPhone: caretakerPhone || '',
      isActive: true
    });

    res.status(201).json({ caretaker });
  } catch (err) {
    console.error('Create caretaker error:', err);
    res.status(500).json({ error: 'Failed to create caretaker account' });
  }
};

// PUT update caretaker
export const updateCaretaker = async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const { id } = req.params;
    const { caretakerName, caretakerPhone, email, password, isActive } = req.body;

    const caretaker = await User.findOne({
      _id: id,
      ownerId: req.user._id,
      role: 'caretaker',
      isDeleted: false
    });
    if (!caretaker) return res.status(404).json({ error: 'Caretaker not found' });

    if (caretakerName  !== undefined) caretaker.caretakerName  = caretakerName;
    if (caretakerPhone !== undefined) caretaker.caretakerPhone = caretakerPhone;
    if (email          !== undefined) caretaker.email          = email.toLowerCase().trim();
    if (isActive       !== undefined) caretaker.isActive       = isActive;
    if (password && password.length >= 6) caretaker.password   = password;

    await caretaker.save();
    res.json({ caretaker });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update caretaker' });
  }
};

// DELETE soft-delete caretaker
export const deleteCaretaker = async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const { id } = req.params;

    const caretaker = await User.findOne({
      _id: id,
      ownerId: req.user._id,
      role: 'caretaker'
    });
    if (!caretaker) return res.status(404).json({ error: 'Caretaker not found' });

    caretaker.isDeleted = true;
    caretaker.isActive  = false;
    await caretaker.save();

    res.json({ message: 'Caretaker account removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove caretaker' });
  }
};
