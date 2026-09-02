import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { TransferService } from '../services/transfer.service';
import { prisma } from '../db';

const connection = process.env.REDIS_URL 
  ? new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null }) 
  : null;

export const transferQueue = connection 
  ? new Queue('transfer-queue', { connection }) 
  : null;

if (connection) {
  const transferWorker = new Worker('transfer-queue', async (job) => {
    console.log(`Processing transfer job ${job.id}...`);
    const { userId, toAccountNumber, amountNum, description, idempotencyKey, transactionId } = job.data;
    try {
      // Execute the synchronous transfer DB logic
      const result = await TransferService.executeTransfer(userId, toAccountNumber, amountNum, description, idempotencyKey, transactionId);
      console.log(`Transfer job ${job.id} completed successfully.`);
      return result;
    } catch (error: any) {
      console.error(`Transfer job ${job.id} failed:`, error);
      
      // Update the pending transaction to FAILED status
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'FAILED' }
      });
      throw error;
    }
  }, { 
    connection,
    concurrency: 5 // Process up to 5 transfers concurrently
  });

  transferWorker.on('failed', (job, err) => {
    console.error(`Transfer Worker: Job ${job?.id} has failed with ${err.message}`);
  });
} else {
  console.log("REDIS_URL not found. Transfer queue is disabled.");
}

export const enqueueTransfer = async (jobData: any) => {
  if (transferQueue) {
    await transferQueue.add('process-transfer', jobData, {
      attempts: 1, // Let's avoid retrying business-logic errors from the queue itself. We already have DB retry for serialization.
    });
    console.log(`Queued transfer job for transaction ${jobData.transactionId}`);
  } else {
    // Synchronous fallback if Redis is not available
    console.warn("Transfer queue is disabled. Processing transfer synchronously.");
    await TransferService.executeTransfer(
      jobData.userId, 
      jobData.toAccountNumber, 
      jobData.amountNum, 
      jobData.description, 
      jobData.idempotencyKey, 
      jobData.transactionId
    );
  }
};
