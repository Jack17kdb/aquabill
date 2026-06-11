import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.isDeleted) return res.status(401).json({ error: 'Account does not exist' });
    if (!user.isActive && user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Account suspended. Please contact support.' });
    }

    // For caretakers: attach their owner's admin account so controllers
    // can scope queries correctly using req.adminId
    if (user.role === 'caretaker') {
      const owner = await User.findById(user.ownerId);
      if (!owner || !owner.isActive || owner.isDeleted) {
        return res.status(403).json({ error: 'Your landlord account is inactive. Contact support.' });
      }
      req.adminId  = owner._id;   // use for DB scoping
      req.adminUser = owner;
    } else {
      req.adminId  = user._id;
      req.adminUser = user;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Not authorized, invalid token' });
  }
};

// Only superadmins
export const superAdminOnly = (req, res, next) => {
  if (req.user?.role !== 'superadmin') {
    return res.status(403).json({ error: 'Superadmin access required' });
  }
  next();
};

// Blocks caretaker role — admin + superadmin only
export const adminOnly = (req, res, next) => {
  if (req.user?.role === 'caretaker') {
    return res.status(403).json({
      error: 'This action requires landlord permission. Please contact your landlord.'
    });
  }
  next();
};
