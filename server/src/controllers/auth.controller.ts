import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { z } from 'zod';
import { JWT_SECRET } from '../middleware/auth';
import { AppError } from '../utils/errors';
import crypto from 'crypto';
import { enqueuePasswordResetEmail } from '../queues/email.queue';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  accountNumber: z.string().regex(/^\d{8,17}$/, "Account number must be 8 to 17 digits"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string(),
});

export const register = async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (existingUser) {
    throw new AppError('DUPLICATE_ENTRY', 'Email is already registered', 409);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: 'CLIENT',
      account: {
        create: {
          accountNumber: data.accountNumber,
          balance: 1000,
        }
      }
    }
  });

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, mfaEnabled: user.mfaEnabled }
  });
};

export const login = async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (!user) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  const isValidPassword = await bcrypt.compare(data.password, user.password);
  
  if (!isValidPassword) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  if (user.mfaEnabled) {
    const tempToken = jwt.sign({ id: user.id, isMfaPending: true }, JWT_SECRET, { expiresIn: '2m' });
    return res.json({ mfaRequired: true, tempToken });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, mfaEnabled: user.mfaEnabled }
  });
};

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const forgotPassword = async (req: Request, res: Response) => {
  const data = forgotPasswordSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  
  if (!user) {
    // Return a success message anyway to prevent email enumeration
    return res.json({ message: 'If an account with that email exists, a password reset token has been sent.' });
  }

  const resetToken = crypto.randomUUID();
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  const expires = new Date();
  expires.setHours(expires.getHours() + 1); // 1 hour from now

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: expires
    }
  });

  // Send the email via Redis queue (falls back to synchronous if no REDIS_URL)
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;
  
  await enqueuePasswordResetEmail(user.email, resetLink);

  res.json({ 
    message: 'If an account with that email exists, a password reset email has been sent.'
  });
};

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export const resetPassword = async (req: Request, res: Response) => {
  const data = resetPasswordSchema.parse(req.body);

  const hashedToken = crypto.createHash('sha256').update(data.token).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { gt: new Date() } // Must not be expired
    }
  });

  if (!user) {
    throw new AppError('INVALID_TOKEN', 'Password reset token is invalid or has expired', 400);
  }

  const hashedPassword = await bcrypt.hash(data.newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    }
  });

  res.json({ message: 'Password has been reset successfully. You can now log in.' });
};

export const setupMfa = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

  const secret = speakeasy.generateSecret({ name: `Horizon Bank (${user.email})` });
  
  await prisma.user.update({
    where: { id: user.id },
    data: { mfaSecret: secret.base32 }
  });

  if (!secret.otpauth_url) {
    throw new AppError('INTERNAL_ERROR', 'Failed to generate MFA URL', 500);
  }
  
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  res.json({ secret: secret.base32, qrCodeUrl });
};

export const verifyMfaSetup = async (req: Request, res: Response) => {
  const { code } = req.body;
  
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user || !user.mfaSecret) throw new AppError('BAD_REQUEST', 'MFA setup not initialized', 400);

  const isValid = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token: code,
    window: 1
  });
  
  if (!isValid) {
    throw new AppError('INVALID_CODE', 'The MFA code is invalid', 400);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { mfaEnabled: true }
  });

  res.json({ message: 'MFA successfully enabled' });
};

export const loginWithMfa = async (req: Request, res: Response) => {
  const { tempToken, code } = req.body;

  try {
    const decoded: any = jwt.verify(tempToken, JWT_SECRET);
    if (!decoded.isMfaPending) throw new Error();

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.mfaEnabled || !user.mfaSecret) throw new Error();

    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 1
    });
    
    if (!isValid) {
      throw new AppError('INVALID_CODE', 'Invalid MFA code', 401);
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, mfaEnabled: user.mfaEnabled }
    });
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    throw new AppError('UNAUTHORIZED', 'Invalid session or token', 401);
  }
};
