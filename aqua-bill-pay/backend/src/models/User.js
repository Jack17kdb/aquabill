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
  // 'superadmin' | 'admin'
  role: {
    type: String,
    enum: ['superadmin', 'admin'],
    default: 'admin'
  },
  // House/property account details (admin only)
  houseName: { type: String, default: '' },
  caretakerName: { type: String, default: '' },
  caretakerPhone: { type: String, default: '' },
  // Price superadmin charges per room/month
  pricePerRoom: { type: Number, default: 50 },
  // Superadmin can disable or delete accounts
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Never return password in JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);
