import { Router } from 'express';
import { TransferController } from '../controllers/transfer.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.post('/', TransferController.transfer);

export default router;
