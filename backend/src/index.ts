import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/orders';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';
import webhookRoutes from './routes/webhooks';
import uploadRoutes from './routes/upload';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

const app = express();
const PORT = process.env.PORT || 5000;

// ===================
// Security Middleware
// ===================
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts per hour
  message: { error: 'Too many login attempts, please try again later.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ===================
// Body Parsing
// ===================
// Stripe webhooks need raw body
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
// JSON for everything else
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ===================
// Logging
// ===================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ===================
// Health Check
// ===================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ===================
// API Routes
// ===================
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/upload', uploadRoutes);

// ===================
// Error Handling
// ===================
app.use(notFound);
app.use(errorHandler);

// ===================
// Start Server
// ===================
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   Zamanẻ ps Store API Server           ║
  ╠════════════════════════════════════════╣
  ║   Environment: ${process.env.NODE_ENV?.padEnd(22)}║
  ║   Port: ${String(PORT).padEnd(30)}║
  ║   Health: http://localhost:${PORT}/health   ║
  ╚════════════════════════════════════════╝
  `);
});

export default app;
