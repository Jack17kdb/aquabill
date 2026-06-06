import { Router } from 'express';
import { submitReadings } from '../controllers/billing.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate, readingsSchema } from '../validators/index.js';

const router = Router();
router.use(protect);
router.post('/submit-readings', validate(readingsSchema), submitReadings);

export default router;
