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
        houseName: user.houseName,
        caretakerName: user.caretakerName,
        isActive: user.isActive
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
