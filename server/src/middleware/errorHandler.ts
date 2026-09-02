import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err);
  require('fs').writeFileSync('error.log', err.stack || err.message);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message }
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { 
        code: 'VALIDATION_ERROR', 
        message: err.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ') 
      }
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: { code: 'DUPLICATE_ENTRY', message: 'An account with this email already exists.' }
      });
    }
    
    if (err.code === 'P1001' || err.code === 'P1002' || err.message.includes("Can't reach database server")) {
      return res.status(503).json({
        error: { code: 'DATABASE_CONNECTION_ERROR', message: 'Unable to connect. Please check your internet connection.' }
      });
    }
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    return res.status(503).json({
      error: { code: 'DATABASE_CONNECTION_ERROR', message: 'Unable to connect. Please wait.' }
    });
  }

  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' }
  });
}
