import { Queue, Worker } from 'bullmq';
import { EmailService } from '../services/email.service';
import IORedis from 'ioredis';

// Create a Redis connection
// If REDIS_URL is not provided (e.g. before the user pastes it), we don't start the queue 
// to prevent connection crash loops.
const connection = process.env.REDIS_URL 
  ? new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null }) 
  : null;

if (connection) {
  connection.on('error', (err: Error) => {
    // Suppress raw stack traces for expected connection resets from cloud providers
    if ((err as any).code === 'ECONNRESET') {
      console.warn('Redis connection reset by peer. Reconnecting...');
    } else {
      console.error('Redis Error:', err.message);
    }
  });
}

export const emailQueue = connection 
  ? new Queue('email-queue', { connection }) 
  : null;

if (connection) {
  // Initialize the worker that processes jobs from the email queue
  const emailWorker = new Worker('email-queue', async (job) => {
    console.log(`Processing email job ${job.id} for ${job.data.email}...`);
    try {
      await EmailService.sendPasswordResetEmail(job.data.email, job.data.resetLink);
      console.log(`Email job ${job.id} completed successfully.`);
    } catch (error) {
      console.error(`Email job ${job.id} failed:`, error);
      throw error;
    }
  }, { connection });

  emailWorker.on('failed', (job, err) => {
    console.error(`Email Worker: Job ${job?.id} has failed with ${err.message}`);
  });
} else {
  console.log("REDIS_URL not found. Email queue is disabled.");
}

// Helper function to add a job to the queue
export const enqueuePasswordResetEmail = async (email: string, resetLink: string) => {
  if (emailQueue) {
    await emailQueue.add('password-reset', { email, resetLink }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      }
    });
    console.log(`Queued password reset email for ${email}`);
  } else {
    console.warn("Queue is disabled. Falling back to sending email synchronously.");
    await EmailService.sendPasswordResetEmail(email, resetLink);
  }
};
