import { Router } from 'express';
import { register, login, forgotPassword, resetPassword, setupMfa, verifyMfaSetup, loginWithMfa } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.post('/login/mfa', loginWithMfa);
router.get('/mfa/setup', requireAuth, setupMfa);
router.post('/mfa/verify', requireAuth, verifyMfaSetup);

export default router;
