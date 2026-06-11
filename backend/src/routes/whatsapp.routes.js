import { Router } from 'express';
import { sendInvoices, sendReminders } from '../controllers/whatsapp.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);
// Caretakers CANNOT send WhatsApp messages — admin (landlord) only
router.post('/send-invoices',  adminOnly, sendInvoices);
router.post('/send-reminders', adminOnly, sendReminders);

export default router;
