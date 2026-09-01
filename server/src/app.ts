import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import accountRoutes from './routes/accounts.routes';
import transferRoutes from './routes/transfers.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/accounts', accountRoutes);
app.use('/api/transfers', transferRoutes);

app.use(errorHandler);

export default app;
