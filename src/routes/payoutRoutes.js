const express = require("express");
const { createPayout, getPayoutById } = require("../services/payoutService");
const { apiTokenAuthPayout } = require("../middleware/auth");

const router = express.Router();

router.post("/payouts", apiTokenAuthPayout, async (req, res, next) => {
  try {
    const payout = await createPayout({
      userId: req.body.userId,
      amount: req.body.amount,
      currency: req.body.currency,
      referenceId: req.body.referenceId,
      metadata: req.body.metadata || {},
    });

    res.status(201).json({ data: payout });
  } catch (error) {
    next(error);
  }
});

router.get("/payouts/:id", apiTokenAuthPayout, async (req, res, next) => {
  try {
    const payout = await getPayoutById(req.params.id);
    res.json({ data: payout });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
