import cron from 'node-cron';
import User from '../models/User.js';
import PropertyUnit from '../models/PropertyUnit.js';
import Payment from '../models/Payment.js';
import { sendWhatsAppMessage } from '../utils/whatsapp.js';

const getBillingPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const startCronJobs = () => {
  // ─────────────────────────────────────────────────────────────────
  // Monthly payment reminder — 28th of each month at 9:00 AM EAT
  // Only sends to accounts that have NOT fully paid this billing period
  // ─────────────────────────────────────────────────────────────────
  cron.schedule('0 9 28 * *', async () => {
    console.log('📅 Running 28th monthly payment reminder cron...');

    try {
      const paymentNumber = process.env.SUPERADMIN_PAYMENT_NUMBER || 'NOT CONFIGURED';
      const billingPeriod = getBillingPeriod();

      // Only active, non-deleted accounts
      const admins = await User.find({ role: 'admin', isActive: true, isDeleted: false });

      let sent    = 0;
      let skipped = 0;
      let failed  = 0;

      for (const admin of admins) {
        if (!admin.caretakerPhone) {
          console.log(`⚠️  No phone for ${admin.houseName || admin.email} — skipping`);
          skipped++;
          continue;
        }

        // Check payment status for this billing period
        const payment = await Payment.findOne({ adminId: admin._id, billingPeriod });

        // Skip if already fully paid
        if (payment?.status === 'completed') {
          console.log(`✅ ${admin.houseName || admin.email} already paid — skipping reminder`);
          skipped++;
          continue;
        }

        try {
          const occupiedRooms  = await PropertyUnit.countDocuments({ ownerId: admin._id, isVacant: false });
          const amountExpected = occupiedRooms * admin.pricePerRoom;
          const amountPaid     = payment?.amountPaid || 0;
          const amountRemaining = amountExpected - amountPaid;

          const now = new Date();
          const monthName = now.toLocaleString('en-KE', { month: 'long', year: 'numeric' });

          let message;

          if (payment?.status === 'partial') {
            // Partial payment — show what's remaining
            message = `Hello ${admin.caretakerName || 'there'},

AquaBill subscription reminder for ${monthName}.

Property: ${admin.houseName || 'Your property'}
Occupied Rooms: ${occupiedRooms}
Total Due: KES ${amountExpected.toLocaleString()}
Amount Paid: KES ${amountPaid.toLocaleString()}
Balance Remaining: KES ${amountRemaining.toLocaleString()}

Please send the remaining KES ${amountRemaining.toLocaleString()} to ${paymentNumber}.

Thank you for using AquaBill.`;
          } else {
            // Not paid at all
            message = `Hello ${admin.caretakerName || 'there'},

AquaBill subscription reminder for ${monthName}.

Property: ${admin.houseName || 'Your property'}
Occupied Rooms: ${occupiedRooms}
Rate: KES ${admin.pricePerRoom}/room
Total Due: KES ${amountExpected.toLocaleString()}

Please send KES ${amountExpected.toLocaleString()} to ${paymentNumber}.

Thank you for using AquaBill.`;
          }

          await sendWhatsAppMessage(admin.caretakerPhone, message);
          sent++;
          console.log(`📱 Reminder sent to ${admin.caretakerName || admin.email} (${payment?.status || 'unpaid'})`);
        } catch (err) {
          failed++;
          console.error(`❌ Failed to send to ${admin.email}: ${err.message}`);
        }
      }

      console.log(`📊 Payment reminders: ${sent} sent, ${skipped} skipped (paid), ${failed} failed`);
    } catch (error) {
      console.error('❌ Monthly payment cron failed:', error.message);
    }
  }, {
    timezone: 'Africa/Nairobi'
  });

  console.log('⏰ Cron: payment reminders on 28th of each month at 9:00 AM EAT (skips fully paid accounts)');
};
