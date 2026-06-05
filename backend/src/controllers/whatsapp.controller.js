import Invoice from '../models/Invoice.js';
import { sendWhatsAppQueue } from '../queues/whatsapp.queue.js';

// Manually re-queue any pending/failed invoices (caretaker-triggered)
export const sendInvoices = async (req, res) => {
  try {
    const { invoiceIds } = req.body;

    let query = {
      ownerId: req.user._id,
      whatsappStatus: { $in: ['pending', 'failed'] }
    };
    if (invoiceIds && invoiceIds.length > 0) {
      query._id = { $in: invoiceIds };
    }

    const invoices = await Invoice.find(query);
    if (invoices.length === 0) {
      return res.json({ message: 'No unsent invoices found', queued: 0 });
    }

    for (const invoice of invoices) {
      await sendWhatsAppQueue.add(
        'send-invoice',
        { invoiceId: invoice._id.toString() },
        {
          jobId: `wa-manual-${invoice._id}-${Date.now()}`,
          attempts: 3,
          backoff: { type: 'exponential', delay: 3000 }
        }
      );
    }

    res.json({
      message: `${invoices.length} invoice(s) queued for WhatsApp delivery`,
      queued: invoices.length
    });
  } catch (error) {
    console.error('Send invoices error:', error);
    res.status(500).json({ error: 'Failed to queue invoices' });
  }
};

// Manual reminder send (caretaker-triggered — NOT automatic)
export const sendReminders = async (req, res) => {
  try {
    const invoices = await Invoice.find({
      ownerId: req.user._id,
      whatsappStatus: 'sent',
      reminderCount: { $lt: 3 }
    });

    if (invoices.length === 0) {
      return res.json({ message: 'No invoices eligible for reminders', queued: 0 });
    }

    const { reminderQueue } = await import('../queues/reminder.queue.js');
    for (const invoice of invoices) {
      await reminderQueue.add(
        'send-reminder',
        { invoiceId: invoice._id.toString() },
        {
          jobId: `reminder-manual-${invoice._id}-${Date.now()}`,
          attempts: 3,
          backoff: { type: 'exponential', delay: 3000 }
        }
      );
    }

    res.json({
      message: `${invoices.length} reminder(s) queued`,
      queued: invoices.length
    });
  } catch (error) {
    console.error('Send reminders error:', error);
    res.status(500).json({ error: 'Failed to queue reminders' });
  }
};
