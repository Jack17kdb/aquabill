import { Router } from 'express';
import { sendInvoices, sendReminders } from '../controllers/whatsapp.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);
router.post('/send-invoices', sendInvoices);
router.post('/send-reminders', sendReminders);

export default router;
