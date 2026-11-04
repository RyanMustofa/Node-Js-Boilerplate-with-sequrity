const crypto = require("crypto");
const payoutRepository = require("../db/repositories/payoutRepository");
const { enqueuePayoutJob } = require("./redisQueue");
const { toPayoutResponse } = require("../mappers/payoutMapper");

async function createPayout({
  userId,
  amount,
  currency,
  referenceId,
  metadata = {},
}) {
  const normalizedAmount = Number(amount);

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    const err = new Error("Invalid payout amount");
    err.statusCode = 400;
    throw err;
  }

  const payout = await payoutRepository.createPayout({
    userId,
    amount: normalizedAmount,
    currency: String(currency || "USD").toUpperCase(),
    referenceId: referenceId || crypto.randomUUID(),
    status: "queued",
    metadata,
  });

  await enqueuePayoutJob({
    payoutId: payout.id,
    userId,
    amount: normalizedAmount,
    currency: payout.currency,
    referenceId: payout.reference_id,
    metadata,
  });

  return toPayoutResponse(payout);
}

async function getPayoutById(id) {
  const payout = await payoutRepository.findPayoutById(id);

  if (!payout) {
    const err = new Error("Payout not found");
    err.statusCode = 404;
    throw err;
  }

  return toPayoutResponse(payout);
}

module.exports = {
  createPayout,
  getPayoutById,
};
