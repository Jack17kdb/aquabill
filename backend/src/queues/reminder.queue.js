import { createQueue, createWorker } from './redis.js';
import Invoice from '../models/Invoice.js';
import { sendWhatsAppMessage, buildReminderMessage } from '../utils/whatsapp.js';

export const reminderQueue = createQueue('send-reminders');

const worker = createWorker('send-reminders', async (job) => {
  const { invoiceId } = job.data;

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

  // Only send reminders for successfully delivered invoices
  if (invoice.whatsappStatus !== 'sent') {
    console.log(`⚠️  Invoice ${invoiceId} not sent yet — skipping reminder`);
    return { skipped: true };
  }
  if (invoice.reminderCount >= 3) {
    console.log(`⚠️  Invoice ${invoiceId} hit max reminders — skipping`);
    return { skipped: true };
  }

  const message = buildReminderMessage(invoice);
  await sendWhatsAppMessage(invoice.phoneNumber, message);

  await Invoice.findByIdAndUpdate(invoiceId, {
    $inc: { reminderCount: 1 },
    $set: { lastReminderAt: new Date() }
  });

  console.log(`🔔 Reminder ${invoice.reminderCount + 1}/3 → ${invoice.tenantName} (${invoice.houseNumber})`);
  return { sent: true, reminderCount: invoice.reminderCount + 1 };
});

worker.on('failed', (job, err) => {
  console.error(`❌ Reminder job ${job.id} failed: ${err.message}`);
});

export default reminderQueue;
