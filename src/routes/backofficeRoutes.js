const crypto = require("crypto");
const express = require("express");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const { safeCompare } = require("../utils/cryptoUtils");
const { payouts, transactions } = require("../data/backofficeDummyData");

if (process.env.NODE_ENV === "production" && !process.env.BO_SESSION_SECRET) {
  throw new Error("BO_SESSION_SECRET must be configured in production");
}

const router = express.Router();
const sessionSecret =
  process.env.BO_SESSION_SECRET || crypto.randomBytes(32).toString("hex");

router.use(
  session({
    name: "bo.sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000,
    },
  }),
);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak percobaan login. Coba lagi nanti." },
});

function requireBackofficeAuth(req, res, next) {
  if (!req.session.backofficeUser) {
    return res.redirect("/bo/login");
  }

  next();
}

function renderLogin(res, options = {}) {
  res.render("bo/auth/login", {
    title: "Masuk ke Backoffice",
    error: options.error || null,
    username: options.username || "",
  });
}

router.get("/login", (req, res) => {
  if (req.session.backofficeUser) {
    return res.redirect("/bo/dashboard");
  }

  renderLogin(res);
});

router.post("/login", loginLimiter, (req, res, next) => {
  const { username, password } = req.body || {};
  const validUsername =
    typeof username === "string" && safeCompare(username, "admin@demo.local");
  const validPassword =
    typeof password === "string" && safeCompare(password, "Demo123!");

  if (!validUsername || !validPassword) {
    return renderLogin(res.status(401), {
      error: "Email atau password tidak sesuai.",
      username: typeof username === "string" ? username : "",
    });
  }

  req.session.regenerate((error) => {
    if (error) {
      return next(error);
    }

    req.session.backofficeUser = {
      name: "Admin Demo",
      email: "admin@demo.local",
      role: "Administrator",
    };

    req.session.save((saveError) => {
      if (saveError) {
        return next(saveError);
      }

      res.redirect("/bo/dashboard");
    });
  });
});

router.post("/logout", requireBackofficeAuth, (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie("bo.sid", { httpOnly: true, sameSite: "lax" });
    res.redirect("/bo/login");
  });
});

router.use(requireBackofficeAuth);

router.get("/", (req, res) => res.redirect("/bo/dashboard"));

router.get("/dashboard", (req, res) => {
  res.render("bo/dashboard", {
    title: "Dashboard",
    activePage: "dashboard",
    user: req.session.backofficeUser,
    summary: {
      totalTransactions: "12.486",
      transactionVolume: "Rp 284,6 jt",
      successfulPayouts: "1.204",
      pendingPayouts: "18",
    },
    transactions: transactions.slice(0, 5),
    payouts: payouts.slice(0, 4),
  });
});

router.get("/transactions", (req, res) => {
  res.render("bo/transactions", {
    title: "Transactions",
    activePage: "transactions",
    user: req.session.backofficeUser,
    transactions,
  });
});

router.get("/payouts", (req, res) => {
  res.render("bo/payouts", {
    title: "Payouts",
    activePage: "payouts",
    user: req.session.backofficeUser,
    payouts,
  });
});

module.exports = router;
