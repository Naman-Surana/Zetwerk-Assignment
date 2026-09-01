import { Router } from 'express';
import { AccountController } from '../controllers/account.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/my-account', AccountController.getMyAccount);
router.get('/my-account/transactions', AccountController.getMyTransactions);

export default router;
