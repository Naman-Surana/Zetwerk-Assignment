import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors';

export const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-fallback-key-do-not-use-in-prod';

export interface AuthUser {
  id: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('UNAUTHORIZED', 'Authentication token is required', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    return next(new AppError('UNAUTHORIZED', 'Invalid or expired token', 401));
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('UNAUTHORIZED', 'Authentication token is required', 401));
  }
  if (req.user.role !== 'ADMIN') {
    return next(new AppError('FORBIDDEN', 'You do not have permission to perform this action', 403));
  }
  next();
};
