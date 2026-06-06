import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Billing period this payment covers e.g. "2025-06"
  billingPeriod: {
    type: String,
    required: true
  },
  occupiedRooms: { type: Number, required: true },
  pricePerRoom: { type: Number, required: true },
  amountExpected: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  phoneNumber: { type: String, required: true },

  // Paynectar / M-Pesa tracking
  checkoutRequestId: { type: String, default: null }, // from STK push response
  merchantRequestId: { type: String, default: null },
  mpesaReceiptNumber: { type: String, default: null }, // from callback

  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'partial'],
    default: 'pending'
  },

  stkPushedAt: { type: Date, default: null },
  paidAt: { type: Date, default: null }
}, { timestamps: true });

// One payment record per admin per billing period
paymentSchema.index({ adminId: 1, billingPeriod: 1 }, { unique: true });

export default mongoose.model('Payment', paymentSchema);
