import Invoice from '../models/Invoice.js';

export const getInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 20, month } = req.query;
    const skip = (page - 1) * limit;

    const filter = { ownerId: req.user._id };
    if (month) {
      const start = new Date(month);
      start.setDate(1); start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      filter.createdAt = { $gte: start, $lt: end };
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Invoice.countDocuments(filter)
    ]);

    res.json({ invoices, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ invoice });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

// Retry failed messages (manual trigger by caretaker)
export const retryFailed = async (req, res) => {
  try {
    const { sendWhatsAppQueue } = await import('../queues/whatsapp.queue.js');
    const failed = await Invoice.find({ ownerId: req.user._id, whatsappStatus: 'failed' });

    if (failed.length === 0) {
      return res.json({ message: 'No failed messages to retry', queued: 0 });
    }

    // Reset status to pending so worker will process them
    await Invoice.updateMany(
      { ownerId: req.user._id, whatsappStatus: 'failed' },
      { $set: { whatsappStatus: 'pending', retryCount: 0 } }
    );

    for (const inv of failed) {
      await sendWhatsAppQueue.add('send-invoice', { invoiceId: inv._id.toString() }, {
        jobId: `wa-retry-${inv._id}-${Date.now()}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 }
      });
    }

    res.json({ message: `Retrying ${failed.length} failed message(s)`, queued: failed.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to queue retries' });
  }
};
