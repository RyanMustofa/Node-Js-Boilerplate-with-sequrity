const express = require("express");
const path = require("path");
const {
  helmet,
  cors,
  jsonParser,
  xssSanitizer,
  rateLimit,
} = require("./middleware/security");
const requireWhitelistedIp = require("./middleware/ipWhitelist");
const {
  apiTokenAuth,
  apiTokenAuthPayout,
  requireJwtAuth,
} = require("./middleware/auth");
const backofficeRoutes = require("./routes/backofficeRoutes");
const payoutRoutes = require("./routes/payoutRoutes");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../resource/views"));
app.set("trust proxy", Number(process.env.TRUST_PROXY || 1));

app.use(
  "/assets",
  express.static(path.join(__dirname, "../resource/public"), {
    maxAge: process.env.NODE_ENV === "production" ? "1d" : 0,
    immutable: process.env.NODE_ENV === "production",
  }),
);
app.use(
  "/vendor/bootstrap",
  express.static(path.join(__dirname, "../node_modules/bootstrap/dist")),
);
app.use(
  "/vendor/bootstrap-icons",
  express.static(path.join(__dirname, "../node_modules/bootstrap-icons")),
);

app.use(helmet);
app.use(cors);
app.use(jsonParser);
app.use(express.urlencoded({ extended: false, limit: "16kb" }));
app.use(xssSanitizer);
app.use(rateLimit);

// IP whitelist check should run after rate limiting but before sensitive auth actions.
// In a real deployment, only trust X-Forwarded-For from explicitly known reverse proxies.
app.use("/api", requireWhitelistedIp);

app.use("/api", payoutRoutes);
app.use("/bo", backofficeRoutes);

app.get("/", (req, res) => res.redirect("/bo/login"));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const payload = {
    error: err.message || "Internal server error",
  };

  if (process.env.NODE_ENV !== "production") {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
});

module.exports = app;
