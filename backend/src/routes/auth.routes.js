import { Router } from 'express';
import { login, getMe, getTemplate, saveTemplate } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate, loginSchema } from '../validators/index.js';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.get('/me', protect, getMe);
router.get('/template', protect, getTemplate);
router.put('/template', protect, saveTemplate);

export default router;
