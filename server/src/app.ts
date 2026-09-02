import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import accountRoutes from './routes/accounts.routes';
import transferRoutes from './routes/transfers.routes';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import { errorHandler } from './middleware/errorHandler';
import rateLimit from 'express-rate-limit';

const app = express();

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

const transferLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: 'Too many transfer requests, please wait a minute'
});

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(globalLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transfers', transferLimiter, transferRoutes);

app.use(errorHandler);

export default app;
