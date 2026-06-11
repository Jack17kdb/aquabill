import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  // 'superadmin' | 'admin' | 'caretaker'
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'caretaker'],
    default: 'admin'
  },
  // For caretaker: which admin account they belong to
  // For admin: null
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // House/property details (admin only — caretaker inherits from owner)
  houseName:     { type: String, default: '' },
  caretakerName: { type: String, default: '' },
  caretakerPhone:{ type: String, default: '' },
  pricePerRoom:  { type: Number, default: 50 },
  isActive:      { type: Boolean, default: true },
  isDeleted:     { type: Boolean, default: false },
  // Custom WhatsApp message template
  // Placeholders: {tenantName} {houseNumber} {previousReading}
  // {currentReading} {unitsUsed} {waterCost}
  messageTemplate: { type: String, default: '' }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);
