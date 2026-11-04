const db = require("../knex");

async function createPayout({
  userId,
  amount,
  currency,
  referenceId,
  status,
  metadata,
}) {
  const [id] = await db("payouts").insert({
    user_id: userId,
    amount,
    currency,
    reference_id: referenceId,
    status,
    metadata: JSON.stringify(metadata || {}),
  });

  return db("payouts").where({ id }).first();
}

async function findPayoutById(id) {
  return db("payouts").where({ id }).first();
}

async function updatePayoutStatus(id, status) {
  return db("payouts").where({ id }).update({ status, updated_at: new Date() });
}

module.exports = {
  createPayout,
  findPayoutById,
  updatePayoutStatus,
};
