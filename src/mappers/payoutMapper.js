function toPayoutResponse(row) {
  return {
    id: row.id,
    userId: row.user_id,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    referenceId: row.reference_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  toPayoutResponse,
};
