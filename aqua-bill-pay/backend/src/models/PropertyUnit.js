import mongoose from 'mongoose';

const propertyUnitSchema = new mongoose.Schema({
  // Which admin account owns this unit
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  houseNumber: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  tenantName: { type: String, trim: true, default: '' },
  phoneNumber: { type: String, trim: true, default: '' },
  isVacant: { type: Boolean, default: false },
  waterMeterPricePerUnit: { type: Number, required: true, default: 50 },
  lastReading: { type: Number, default: 0 },
  currentReading: { type: Number, default: 0 },
  lastBilledAt: { type: Date, default: null },
  ownerDetails: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' }
  }
}, { timestamps: true });

// House number unique per owner (not globally)
propertyUnitSchema.index({ ownerId: 1, houseNumber: 1 }, { unique: true });

export default mongoose.model('PropertyUnit', propertyUnitSchema);
