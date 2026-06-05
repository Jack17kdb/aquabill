import { createQueue, createWorker } from './redis.js';
import Invoice from '../models/Invoice.js';
import { sendWhatsAppMessage, buildInvoiceMessage } from '../utils/whatsapp.js';

export const sendWhatsAppQueue = createQueue('send-whatsapp');

const worker = createWorker('send-whatsapp', async (job) => {
  const { invoiceId } = job.data;

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

  // Already successfully sent — do not duplicate
  if (invoice.whatsappStatus === 'sent') {
    console.log(`⚠️  Invoice ${invoiceId} already sent — skipping`);
    return { skipped: true };
  }

  // Track attempt
  await Invoice.findByIdAndUpdate(invoiceId, {
    $set: { lastAttemptAt: new Date() },
    $inc: { retryCount: 1 }
  });

  const message = buildInvoiceMessage(invoice);
  await sendWhatsAppMessage(invoice.phoneNumber, message);

  // Mark sent ONLY after confirmed delivery
  await Invoice.findByIdAndUpdate(invoiceId, {
    $set: { whatsappStatus: 'sent' }
  });

  console.log(`📱 WhatsApp sent → ${invoice.tenantName} (${invoice.houseNumber})`);
  return { sent: true, houseNumber: invoice.houseNumber };
});

// On final failure (all retries exhausted) — mark as failed, do NOT retry further
worker.on('failed', async (job, err) => {
  const { invoiceId } = job.data;
  console.error(`❌ WhatsApp job ${job.id} failed permanently for invoice ${invoiceId}: ${err.message}`);
  try {
    await Invoice.findByIdAndUpdate(invoiceId, {
      $set: { whatsappStatus: 'failed' }
    });
  } catch (e) {
    console.error('Could not update invoice status to failed:', e.message);
  }
});

worker.on('completed', (job, result) => {
  if (!result?.skipped) console.log(`✅ WhatsApp delivered: ${result?.houseNumber}`);
});

export default sendWhatsAppQueue;
