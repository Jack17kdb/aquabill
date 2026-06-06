import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  houseId: { type: mongoose.Schema.Types.ObjectId, ref: 'PropertyUnit', required: true },
  houseNumber: { type: String, required: true },
  tenantName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  previousReading: { type: Number, required: true },
  currentReading: { type: Number, required: true },
  unitsUsed: { type: Number, required: true },
  waterCost: { type: Number, required: true },
  pricePerUnit: { type: Number, required: true },

  // Idempotency: billing cycle key = "houseId_YYYY-MM"
  billingCycleKey: { type: String, required: true },

  // Robust delivery tracking
  whatsappStatus: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  retryCount: { type: Number, default: 0 },
  lastAttemptAt: { type: Date, default: null },

  // Tenant reminders (manual — caretaker-triggered only)
  reminderCount: { type: Number, default: 0 },
  lastReminderAt: { type: Date, default: null }
}, { timestamps: true });

// Prevent duplicate invoices for the same house in the same billing cycle
invoiceSchema.index({ houseId: 1, billingCycleKey: 1 }, { unique: true });

export default mongoose.model('Invoice', invoiceSchema);
