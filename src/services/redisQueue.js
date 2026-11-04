const { Queue, Worker } = require("bullmq");
const IORedis = require("ioredis");
const env = require("../config/env");
const logger = require("../utils/logger");

const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  lazyConnect: true,
});

let payoutQueue;
let payoutWorker;

try {
  payoutQueue = new Queue("payout-queue", { connection });

  payoutWorker = new Worker(
    "payout-queue",
    async (job) => {
      logger.info("Processing payout job", {
        jobId: job.id,
        jobData: job.data,
      });
      return { processed: true, jobId: job.id };
    },
    { connection },
  );

  payoutWorker.on("failed", (job, err) => {
    logger.error("Payout job failed", {
      jobId: job && job.id,
      error: err.message,
    });
  });
} catch (error) {
  logger.warn(
    "Redis queue is unavailable. BullMQ worker was not started. Configure REDIS_URL and a running Redis 5+ instance to enable queue processing.",
    { error: error.message },
  );
}

async function enqueuePayoutJob(data) {
  if (!payoutQueue) {
    throw new Error(
      "Redis queue is not available. Set REDIS_URL and ensure Redis 5+ is running before queueing payouts.",
    );
  }

  return payoutQueue.add("process-payout", data, {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  });
}

module.exports = {
  enqueuePayoutJob,
  payoutQueue,
  payoutWorker,
};
