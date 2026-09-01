import { Router } from 'express';
import { listUsers, getUserAccount, getUserTransactions } from '../controllers/admin.controller';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/users', listUsers);
router.get('/users/:userId/account', getUserAccount);
router.get('/users/:userId/transactions', getUserTransactions);

export default router;
