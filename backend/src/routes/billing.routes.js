import { Router } from 'express';
import { submitReadings } from '../controllers/billing.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate, readingsSchema } from '../validators/index.js';

const router = Router();
router.use(protect);
// Both admin and caretaker can submit readings
router.post('/submit-readings', validate(readingsSchema), submitReadings);

export default router;
