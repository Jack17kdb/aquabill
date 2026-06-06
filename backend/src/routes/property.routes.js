import { Router } from 'express';
import {
  createProperty,
  getAllProperties,
  updateProperty,
  markVacant,
  getStats,
  getPublicHouseInfo,
  publicRegisterRoom
} from '../controllers/property.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate, propertySchema } from '../validators/index.js';

const router = Router();

// ── Public routes (no auth) ───────────────────────────────────────
router.get('/public/:ownerId',    getPublicHouseInfo);
router.post('/public/:ownerId',   publicRegisterRoom);

// ── Protected routes ──────────────────────────────────────────────
router.use(protect);
router.post('/create',         validate(propertySchema), createProperty);
router.get('/all',             getAllProperties);
router.get('/stats',           getStats);
router.put('/update/:id',      updateProperty);
router.patch('/vacant/:id',    markVacant);

export default router;
