import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import roleRoutes from './routes/roles.js';
import locationRoutes from './routes/locations.js';
import inverterTypeRoutes from './routes/inverterType.js';
import inverterRoutes from './routes/inverter.js';
import settingsRoutes from './routes/settings.js';
import projectsRouter from './routes/projects.js';
import projectInvertersRoutes from './routes/projectInverters.js';
import invoiceRoutes from './routes/invoice.js';
import projectTypesRoutes from './routes/projectTypes.js';
import paymentsRoutes from './routes/payments.js';
import newsRoutes from './routes/news.js';
import testimonialRoutes from './routes/testimonial.js';
import contactusRoutes from './routes/contactus.js';
import blogRoutes from './routes/blog.js';
import leaseRoutes from './routes/lease.js';
import investerRoutes from './routes/invester.js';
import contractRoutes from './routes/contract.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

console.log('process.env.NODE_ENV', process.env.NODE_ENV);
console.log('process.env.FRONTEND_URL', process.env.FRONTEND_URL);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Debug middleware
app.use((req, res, next) => {
  // console.log(`${req.method} ${req.path}`);
  // console.log('Headers:', req.headers);
  // console.log('Body:', req.body);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/inverterTypes', inverterTypeRoutes);
app.use('/api/inverters', inverterRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/projects', projectsRouter);
app.use('/api/project-inverters', projectInvertersRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/project-types', projectTypesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/contactus', contactusRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/lease', leaseRoutes);
app.use('/api/investors', investerRoutes);
app.use('/api/contracts', contractRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
