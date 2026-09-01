import { Router } from 'express';
import { TransferController } from '../controllers/transfer.controller';

const router = Router();

router.post('/', TransferController.transfer);

export default router;
