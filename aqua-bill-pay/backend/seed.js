import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

import User from './src/models/User.js';

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const email = process.env.SUPERADMIN_EMAIL || 'superadmin@aquabill.co.ke';
    const password = process.env.SUPERADMIN_PASSWORD || 'changeme123';

    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.role !== 'superadmin') {
        existing.role = 'superadmin';
        await existing.save();
        console.log(`✅ Upgraded ${email} to superadmin`);
      } else {
        console.log(`ℹ️  Superadmin already exists: ${email}`);
      }
    } else {
      await User.create({ email, password, role: 'superadmin', isActive: true });
      console.log(`✅ Superadmin created: ${email}`);
    }

    console.log('\n🔑 Login at /login with:');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n⚠️  Change your password after first login!\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
