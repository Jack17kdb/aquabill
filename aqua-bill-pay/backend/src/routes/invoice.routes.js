import { Router } from 'express';
import { getInvoices, getInvoiceById, retryFailed } from '../controllers/invoice.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);
router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.post('/retry-failed', retryFailed);

export default router;
