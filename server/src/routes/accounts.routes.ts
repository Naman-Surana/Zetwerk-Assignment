import { Router } from 'express';
import { AccountController } from '../controllers/account.controller';

const router = Router();

router.post('/', AccountController.create);
router.get('/', AccountController.list);
router.get('/:id', AccountController.getOne);
router.get('/:id/transactions', AccountController.getTransactions);

export default router;
