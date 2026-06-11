import { Router } from 'express';
import { getInvoices, getInvoiceById, retryFailed } from '../controllers/invoice.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);
// Caretakers cannot view or retry invoices — admin only
router.get('/',             adminOnly, getInvoices);
router.get('/:id',          adminOnly, getInvoiceById);
router.post('/retry-failed', adminOnly, retryFailed);

export default router;
