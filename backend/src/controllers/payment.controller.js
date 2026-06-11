import axios from 'axios';
import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import PropertyUnit from '../models/PropertyUnit.js';
import User from '../models/User.js';

const getBillingPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const paynectarHeaders = () => ({
  'Authorization': `Bearer ${process.env.PAYNECTAR_API_KEY}`,
  'X-Secret-Key': process.env.PAYNECTAR_SECRET_KEY,
  'Content-Type': 'application/json'
});

// ── GET: prefill data for the Pay modal ───────────────────────────
export const getPaymentDetails = async (req, res) => {
  try {
    const admin = req.adminUser;
    const occupiedRooms = await PropertyUnit.countDocuments({
      ownerId: admin._id,
      isVacant: false
    });
    const amountExpected = occupiedRooms * admin.pricePerRoom;
    const billingPeriod  = getBillingPeriod();

    // Check if already paid this period
    const existing = await Payment.findOne({ adminId: admin._id, billingPeriod });

    res.json({
      caretakerPhone: admin.caretakerPhone || '',
      caretakerName:  admin.caretakerName  || '',
      houseName:      admin.houseName      || '',
      occupiedRooms,
      pricePerRoom:   admin.pricePerRoom,
      amountExpected,
      billingPeriod,
      existingPayment: existing ? {
        status:           existing.status,
        amountPaid:       existing.amountPaid,
        mpesaReceiptNumber: existing.mpesaReceiptNumber,
        paidAt:           existing.paidAt
      } : null
    });
  } catch (err) {
    console.error('getPaymentDetails error:', err);
    res.status(500).json({ error: 'Failed to load payment details' });
  }
};

// ── POST: trigger STK push via Paynectar ─────────────────────────
export const initiateStkPush = async (req, res) => {
  try {
    const { phoneNumber, amount } = req.body;

    if (!phoneNumber || !amount) {
      return res.status(400).json({ error: 'Phone number and amount are required' });
    }
    if (Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const admin        = req.user;
    const billingPeriod = getBillingPeriod();
    const occupiedRooms = await PropertyUnit.countDocuments({ ownerId: admin._id, isVacant: false });
    const amountExpected = occupiedRooms * admin.pricePerRoom;

    // Upsert payment record
    let payment = await Payment.findOne({ adminId: admin._id, billingPeriod });
    if (payment && payment.status === 'completed') {
      return res.status(400).json({ error: 'This billing period is already fully paid' });
    }

    if (!payment) {
      payment = await Payment.create({
        adminId: admin._id,
        billingPeriod,
        occupiedRooms,
        pricePerRoom: admin.pricePerRoom,
        amountExpected,
        phoneNumber,
        status: 'pending'
      });
    }

    // Format phone for M-Pesa: 254XXXXXXXXX
    let phone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (phone.startsWith('0'))       phone = '254' + phone.slice(1);
    else if (phone.startsWith('+')) phone = phone.slice(1);

    const callbackUrl = `${process.env.BACKEND_URL}/api/payment/callback`;

    // Paynectar STK push request
    const paynectarRes = await axios.post(
      `${process.env.PAYNECTAR_BASE_URL}/v1/mpesa/stkpush`,
      {
        phone,
        amount: Number(amount),
        accountReference: `AQUABILL-${admin.houseName || admin._id}`.slice(0, 20),
        transactionDesc: `AquaBill ${billingPeriod}`,
        callbackUrl
      },
      { headers: paynectarHeaders(), timeout: 15000 }
    );

    const { checkoutRequestId, merchantRequestId } = paynectarRes.data;

    // Save STK push identifiers
    await Payment.findByIdAndUpdate(payment._id, {
      $set: {
        checkoutRequestId,
        merchantRequestId,
        phoneNumber: phone,
        stkPushedAt: new Date()
      }
    });

    res.json({
      message:  'STK push sent — please check your phone and enter your M-Pesa PIN',
      checkoutRequestId,
      paymentId: payment._id
    });
  } catch (err) {
    console.error('STK push error:', err.response?.data || err.message);
    res.status(500).json({
      error: err.response?.data?.message || 'Failed to initiate STK push'
    });
  }
};

// ── POST: Paynectar callback (called by Paynectar after payment) ──
export const paymentCallback = async (req, res) => {
  try {
    // Always respond 200 immediately so Paynectar doesn't retry
    res.status(200).json({ received: true });

    const body = req.body;

    // Paynectar wraps M-Pesa callback in their own envelope
    // Adjust field names if Paynectar uses different keys
    const {
      checkoutRequestId,
      resultCode,
      resultDesc,
      amount,
      mpesaReceiptNumber,
      phoneNumber
    } = body?.data || body;

    if (!checkoutRequestId) {
      console.warn('⚠️  Callback missing checkoutRequestId:', body);
      return;
    }

    const payment = await Payment.findOne({ checkoutRequestId });
    if (!payment) {
      console.warn(`⚠️  No payment found for checkoutRequestId: ${checkoutRequestId}`);
      return;
    }

    if (String(resultCode) === '0') {
      // Success
      const newAmountPaid = (payment.amountPaid || 0) + Number(amount);
      const isComplete    = newAmountPaid >= payment.amountExpected;

      await Payment.findByIdAndUpdate(payment._id, {
        $set: {
          amountPaid:         newAmountPaid,
          mpesaReceiptNumber: mpesaReceiptNumber || null,
          status:             isComplete ? 'completed' : 'partial',
          paidAt:             new Date()
        }
      });

      console.log(`✅ Payment ${isComplete ? 'completed' : 'partial'} for admin ${payment.adminId}: KES ${newAmountPaid}`);
    } else {
      // Failed / cancelled
      await Payment.findByIdAndUpdate(payment._id, {
        $set: { status: 'failed' }
      });
      console.log(`❌ Payment failed for admin ${payment.adminId}: ${resultDesc}`);
    }
  } catch (err) {
    console.error('Callback processing error:', err.message);
  }
};

// ── GET: poll payment status (frontend polls after STK push) ──────
export const getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findOne({ _id: paymentId, adminId: req.user._id });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    res.json({
      status:             payment.status,
      amountPaid:         payment.amountPaid,
      amountExpected:     payment.amountExpected,
      mpesaReceiptNumber: payment.mpesaReceiptNumber,
      paidAt:             payment.paidAt
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
};
