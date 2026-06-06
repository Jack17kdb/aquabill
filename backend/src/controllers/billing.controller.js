import mongoose from 'mongoose';
import PropertyUnit from '../models/PropertyUnit.js';
import Invoice from '../models/Invoice.js';
import { generateInvoiceQueue } from '../queues/invoice.queue.js';

// Build a billing cycle key: "houseId_2025-06"
const getBillingCycleKey = (houseId) => {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `${houseId}_${ym}`;
};

export const submitReadings = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { readings } = req.body;
    const results = [];
    const errors = [];
    const skippedDuplicates = [];

    for (const r of readings) {
      // ── Fetch & validate ──
      const house = await PropertyUnit.findOne(
        { _id: r.houseId, ownerId: req.user._id },
        null,
        { session }
      );

      if (!house) {
        errors.push({ houseId: r.houseId, error: 'House not found' });
        continue;
      }
      if (house.isVacant) {
        errors.push({ houseNumber: house.houseNumber, error: 'House is vacant — skip billing' });
        continue;
      }

      // Strict: currentReading must be >= lastReading (not currentReading which may be stale)
      const previousReading = house.lastReading;
      if (typeof r.currentReading !== 'number' || isNaN(r.currentReading)) {
        errors.push({ houseNumber: house.houseNumber, error: 'Invalid reading value' });
        continue;
      }
      if (r.currentReading < previousReading) {
        errors.push({
          houseNumber: house.houseNumber,
          error: `Reading ${r.currentReading} cannot be less than previous reading ${previousReading}`
        });
        continue;
      }

      // ── Idempotency check: block duplicate billing in the same month ──
      const cycleKey = getBillingCycleKey(house._id.toString());
      const existingInvoice = await Invoice.findOne({ billingCycleKey: cycleKey }, null, { session });
      if (existingInvoice) {
        skippedDuplicates.push({
          houseNumber: house.houseNumber,
          message: `Already billed this cycle (${cycleKey.split('_')[1]})`
        });
        continue;
      }

      // ── Correct reading progression ──
      // previousReading = house.lastReading  (what was billed last cycle)
      // After billing: lastReading → currentReading  (ready for next cycle)
      await PropertyUnit.findByIdAndUpdate(
        house._id,
        {
          $set: {
            lastReading: r.currentReading,   // ← this becomes "previous" next cycle
            currentReading: r.currentReading, // track latest known value
            lastBilledAt: new Date()
          }
        },
        { session }
      );

      const unitsUsed = r.currentReading - previousReading;
      const waterCost = unitsUsed * house.waterMeterPricePerUnit;

      results.push({
        houseId: house._id.toString(),
        houseNumber: house.houseNumber,
        tenantName: house.tenantName,
        phoneNumber: house.phoneNumber,
        previousReading,
        currentReading: r.currentReading,
        unitsUsed,
        waterCost,
        pricePerUnit: house.waterMeterPricePerUnit,
        billingCycleKey: cycleKey,
        ownerId: req.user._id.toString()
      });
    }

    if (results.length === 0 && errors.length === 0 && skippedDuplicates.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        error: 'All submitted readings were already billed this cycle',
        skippedDuplicates
      });
    }
    if (results.length === 0 && errors.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'No valid readings to process', errors });
    }

    // ── Commit DB changes atomically, THEN enqueue ──
    await session.commitTransaction();

    if (results.length > 0) {
      await generateInvoiceQueue.add(
        'generate-invoices',
        { readings: results },
        {
          jobId: `billing-${req.user._id}-${Date.now()}`, // unique jobId prevents duplicate queue entries
          attempts: 5,
          backoff: { type: 'exponential', delay: 3000 },
          removeOnComplete: { age: 86400 },
          removeOnFail: false
        }
      );
    }

    res.json({
      message: `${results.length} reading(s) accepted and queued for billing`,
      processed: results.length,
      skippedErrors: errors.length,
      skippedDuplicates: skippedDuplicates.length,
      errors: errors.length > 0 ? errors : undefined,
      duplicates: skippedDuplicates.length > 0 ? skippedDuplicates : undefined
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Submit readings error:', error);
    res.status(500).json({ error: 'Failed to process readings — transaction rolled back' });
  } finally {
    session.endSession();
  }
};
