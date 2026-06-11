import { Router } from 'express';
import {
  getPaymentDetails,
  initiateStkPush,
  paymentCallback,
  getPaymentStatus
} from '../controllers/payment.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = Router();

// Public callback — Paynectar calls this, no JWT
router.post('/callback', paymentCallback);

// Admin only — caretaker cannot pay or view subscription
router.use(protect, adminOnly);
router.get('/details',           getPaymentDetails);
router.post('/stk-push',         initiateStkPush);
router.get('/status/:paymentId', getPaymentStatus);

export default router;
