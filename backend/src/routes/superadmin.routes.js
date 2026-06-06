import { Router } from 'express';
import {
  getAllAccounts,
  toggleAccountStatus,
  deleteAccount,
  updateAccount,
  sendPaymentReminder,
  getSuperAdminStats,
  getPaymentOverview
} from '../controllers/superadmin.controller.js';
import { createAdminAccount } from '../controllers/auth.controller.js';
import { protect, superAdminOnly } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect, superAdminOnly);

router.get('/stats', getSuperAdminStats);
router.get('/accounts', getAllAccounts);
router.post('/accounts', createAdminAccount);
router.put('/accounts/:id', updateAccount);
router.patch('/accounts/:id/toggle', toggleAccountStatus);
router.delete('/accounts/:id', deleteAccount);
router.post('/accounts/:id/remind', sendPaymentReminder);

router.get('/payments', getPaymentOverview);

export default router;
