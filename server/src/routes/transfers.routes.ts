import { Router } from 'express';
import { TransferController } from '../controllers/transfer.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.post('/', TransferController.transfer);
router.post('/:id/verify-otp', TransferController.verifyOtp);

export default router;
