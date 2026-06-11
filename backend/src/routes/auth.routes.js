import { Router } from 'express';
import { login, getMe, getTemplate, saveTemplate, getCaretakers, createCaretaker, updateCaretaker, deleteCaretaker } from '../controllers/auth.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import { validate, loginSchema } from '../validators/index.js';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.get('/me', protect, getMe);
router.get('/template', protect, getTemplate);
router.put('/template', protect, saveTemplate);

// Caretaker management — admin only
router.get('/caretakers',         protect, adminOnly, getCaretakers);
router.post('/caretakers',        protect, adminOnly, createCaretaker);
router.put('/caretakers/:id',     protect, adminOnly, updateCaretaker);
router.delete('/caretakers/:id',  protect, adminOnly, deleteCaretaker);

export default router;
