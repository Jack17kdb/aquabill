import mongoose from 'mongoose';
import { createQueue, createWorker } from './redis.js';
import Invoice from '../models/Invoice.js';
import { sendWhatsAppQueue } from './whatsapp.queue.js';

export const generateInvoiceQueue = createQueue('generate-invoices');

const worker = createWorker('generate-invoices', async (job) => {
  const { readings } = job.data;
  const createdInvoiceIds = [];

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (const r of readings) {
      // Double-check idempotency inside the worker too (safe retry guard)
      const existing = await Invoice.findOne({ billingCycleKey: r.billingCycleKey }, null, { session });
      if (existing) {
        console.log(`⚠️  Invoice already exists for cycle ${r.billingCycleKey} — skipping`);
        createdInvoiceIds.push(existing._id.toString());
        continue;
      }

      const invoice = await Invoice.create([{
        ownerId: r.ownerId,
        houseId: r.houseId,
        houseNumber: r.houseNumber,
        tenantName: r.tenantName,
        phoneNumber: r.phoneNumber,
        previousReading: r.previousReading,
        currentReading: r.currentReading,
        unitsUsed: r.unitsUsed,
        waterCost: r.waterCost,
        pricePerUnit: r.pricePerUnit,
        billingCycleKey: r.billingCycleKey,
        whatsappStatus: 'pending',
        retryCount: 0,
        reminderCount: 0
      }], { session });

      createdInvoiceIds.push(invoice[0]._id.toString());
      console.log(`✅ Invoice created for ${r.houseNumber}: KES ${r.waterCost}`);
    }

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err; // BullMQ will retry the job
  } finally {
    session.endSession();
  }

  // Fetch custom template for this owner (if set)
  let messageTemplate = '';
  if (readings.length > 0 && readings[0].ownerId) {
    try {
      const User = (await import('../models/User.js')).default;
      const owner = await User.findById(readings[0].ownerId).select('messageTemplate');
      messageTemplate = owner?.messageTemplate || '';
    } catch { /* use default */ }
  }

  // Queue WhatsApp messages AFTER successful DB commit
  for (const invoiceId of createdInvoiceIds) {
    await sendWhatsAppQueue.add(
      'send-invoice',
      { invoiceId, messageTemplate },
      {
        jobId: `wa-invoice-${invoiceId}`, // prevents duplicate WA jobs on retry
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { age: 86400 },
        removeOnFail: false
      }
    );
  }

  return { created: createdInvoiceIds.length };
});

worker.on('failed', (job, err) => {
  console.error(`❌ Invoice generation job ${job.id} failed (attempt ${job.attemptsMade}): ${err.message}`);
});
worker.on('completed', (job, result) => {
  console.log(`✅ Invoice generation job ${job.id} done: ${result.created} invoice(s)`);
});

export default generateInvoiceQueue;
