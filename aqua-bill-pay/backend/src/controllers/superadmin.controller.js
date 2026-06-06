import User from '../models/User.js';
import PropertyUnit from '../models/PropertyUnit.js';
import { sendWhatsAppMessage } from '../utils/whatsapp.js';

// GET all admin house accounts with their room stats
export const getAllAccounts = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin', isDeleted: false }).sort({ createdAt: -1 });

    // For each admin, count their occupied/total rooms
    const accounts = await Promise.all(admins.map(async (admin) => {
      const total = await PropertyUnit.countDocuments({ ownerId: admin._id });
      const occupied = await PropertyUnit.countDocuments({ ownerId: admin._id, isVacant: false });
      const vacant = total - occupied;
      const monthlyFee = occupied * admin.pricePerRoom;

      return {
        _id: admin._id,
        email: admin.email,
        houseName: admin.houseName,
        caretakerName: admin.caretakerName,
        caretakerPhone: admin.caretakerPhone,
        pricePerRoom: admin.pricePerRoom,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
        stats: { total, occupied, vacant, monthlyFee }
      };
    }));

    res.json({ accounts });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
};

// PATCH toggle active/suspended
export const toggleAccountStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await User.findOne({ _id: id, role: 'admin', isDeleted: false });
    if (!admin) return res.status(404).json({ error: 'Account not found' });

    admin.isActive = !admin.isActive;
    await admin.save();

    res.json({
      message: `Account ${admin.isActive ? 'activated' : 'suspended'}`,
      isActive: admin.isActive
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update account status' });
  }
};

// DELETE soft-delete account
export const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await User.findOne({ _id: id, role: 'admin' });
    if (!admin) return res.status(404).json({ error: 'Account not found' });

    admin.isDeleted = true;
    admin.isActive = false;
    await admin.save();

    res.json({ message: `Account for ${admin.houseName || admin.email} deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

// PUT edit account details
export const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { houseName, caretakerName, caretakerPhone, pricePerRoom, email, password } = req.body;

    const admin = await User.findOne({ _id: id, role: 'admin', isDeleted: false });
    if (!admin) return res.status(404).json({ error: 'Account not found' });

    if (houseName !== undefined) admin.houseName = houseName;
    if (caretakerName !== undefined) admin.caretakerName = caretakerName;
    if (caretakerPhone !== undefined) admin.caretakerPhone = caretakerPhone;
    if (pricePerRoom !== undefined) admin.pricePerRoom = Number(pricePerRoom);
    if (email !== undefined) admin.email = email.toLowerCase().trim();
    if (password && password.length >= 6) admin.password = password; // will be hashed by pre-save hook

    await admin.save();
    res.json({ user: admin });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
};

// POST send WhatsApp payment reminder to caretaker
export const sendPaymentReminder = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await User.findOne({ _id: id, role: 'admin', isDeleted: false });
    if (!admin) return res.status(404).json({ error: 'Account not found' });

    if (!admin.caretakerPhone) {
      return res.status(400).json({ error: 'No caretaker phone number on record' });
    }

    // Count total rooms to calculate fee
    const occupiedRooms = await PropertyUnit.countDocuments({ ownerId: admin._id, isVacant: false });
    const amountDue = occupiedRooms * admin.pricePerRoom;
    const paymentNumber = process.env.SUPERADMIN_PAYMENT_NUMBER || 'NOT SET';

    const message = `Hello ${admin.caretakerName || 'there'},

This is a reminder from AquaBill.

Your monthly subscription fee is due:

Occupied Rooms: ${occupiedRooms}
Rate: KES ${admin.pricePerRoom}/room
Total Due: KES ${amountDue.toLocaleString()}

Please send KES ${amountDue.toLocaleString()} to ${paymentNumber}.

Thank you.`;

    await sendWhatsAppMessage(admin.caretakerPhone, message);

    res.json({
      message: `Payment reminder sent to ${admin.caretakerName || admin.caretakerPhone}`,
      amountDue,
      occupiedRooms
    });
  } catch (error) {
    console.error('Send payment reminder error:', error);
    res.status(500).json({ error: 'Failed to send reminder' });
  }
};

// GET superadmin dashboard stats
export const getSuperAdminStats = async (req, res) => {
  try {
    const totalAccounts = await User.countDocuments({ role: 'admin', isDeleted: false });
    const activeAccounts = await User.countDocuments({ role: 'admin', isDeleted: false, isActive: true });
    const suspendedAccounts = totalAccounts - activeAccounts;

    const totalRooms = await PropertyUnit.countDocuments();
    const occupiedRooms = await PropertyUnit.countDocuments({ isVacant: false });

    // Sum of all monthly fees (occupiedRooms * pricePerRoom per admin)
    const admins = await User.find({ role: 'admin', isDeleted: false, isActive: true });
    let totalMonthlyRevenue = 0;
    for (const admin of admins) {
      const rooms = await PropertyUnit.countDocuments({ ownerId: admin._id, isVacant: false });
      totalMonthlyRevenue += rooms * admin.pricePerRoom;
    }

    res.json({
      totalAccounts,
      activeAccounts,
      suspendedAccounts,
      totalRooms,
      occupiedRooms,
      totalMonthlyRevenue
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// ── GET: payment status for all accounts (for superadmin tracking) ──
export const getPaymentOverview = async (req, res) => {
  try {
    const Payment = (await import('../models/Payment.js')).default;

    const now = new Date();
    const billingPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const admins = await User.find({ role: 'admin', isDeleted: false }).sort({ houseName: 1 });

    const overview = await Promise.all(admins.map(async (admin) => {
      const occupiedRooms  = await PropertyUnit.countDocuments({ ownerId: admin._id, isVacant: false });
      const amountExpected = occupiedRooms * admin.pricePerRoom;

      const payment = await Payment.findOne({ adminId: admin._id, billingPeriod });

      return {
        _id:           admin._id,
        houseName:     admin.houseName || admin.email,
        caretakerName: admin.caretakerName,
        caretakerPhone: admin.caretakerPhone,
        isActive:      admin.isActive,
        occupiedRooms,
        amountExpected,
        billingPeriod,
        payment: payment ? {
          status:             payment.status,
          amountPaid:         payment.amountPaid,
          amountExpected:     payment.amountExpected,
          mpesaReceiptNumber: payment.mpesaReceiptNumber,
          paidAt:             payment.paidAt
        } : null
      };
    }));

    // Summary counts
    const renewed  = overview.filter(a => a.payment?.status === 'completed').length;
    const partial  = overview.filter(a => a.payment?.status === 'partial').length;
    const overdue  = overview.filter(a => !a.payment || a.payment.status === 'pending' || a.payment.status === 'failed').length;

    res.json({ overview, billingPeriod, summary: { renewed, partial, overdue } });
  } catch (err) {
    console.error('getPaymentOverview error:', err);
    res.status(500).json({ error: 'Failed to fetch payment overview' });
  }
};
