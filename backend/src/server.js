import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { connectDB } from './utils/db.js';
import authRoutes from './routes/auth.routes.js';
import propertyRoutes from './routes/property.routes.js';
import billingRoutes from './routes/billing.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import whatsappRoutes from './routes/whatsapp.routes.js';
import superadminRoutes from './routes/superadmin.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import { startCronJobs } from './jobs/cron.js';
import { requestLogger, errorLogger, logStartup, errorHandler, notFoundHandler, printStartupBanner } from './middleware/logger.middleware.js';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Live request logging ──────────────────────────────────────────
app.use(requestLogger);

// General rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', generalLimiter);

// Auth: strict limit to block brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later.' }
});
app.use('/api/auth/', authLimiter);

// Billing: prevent accidental double-submissions
// 5 submissions per 10 minutes per IP is plenty for a caretaker
const billingLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { error: 'Too many billing submissions. Please wait before trying again.' }
});
app.use('/api/billing/submit-readings', billingLimiter);

// WhatsApp send: prevent message spam
const whatsappLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { error: 'Too many send requests. Please wait before sending again.' }
});
app.use('/api/whatsapp/', whatsappLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/property', propertyRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/payment', paymentRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

if(process.env.NODE_ENV === 'production'){
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend', 'dist', 'index.html'))
  });
};

app.use(notFoundHandler);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    printStartupBanner(PORT, process.env.NODE_ENV || 'development');
    startCronJobs();
  });
}).catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

export default app;
