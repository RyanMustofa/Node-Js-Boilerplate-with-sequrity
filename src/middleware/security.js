const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const sanitizeHtml = require("sanitize-html");

function sanitizeObject(input) {
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeObject(item));
  }

  if (input && typeof input === "object") {
    const clean = {};
    Object.keys(input).forEach((key) => {
      const value = input[key];
      if (typeof value === "string") {
        clean[key] = sanitizeHtml(value, {
          allowedTags: [],
          allowedAttributes: {},
          allowedSchemes: [],
        });
      } else {
        clean[key] = sanitizeObject(value);
      }
    });
    return clean;
  }

  return input;
}

function xssSanitizerMiddleware(req, res, next) {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
}

const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

const securityMiddlewares = {
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  }),
  cors: cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "x-api-key",
      "X-Signature",
    ],
    credentials: true,
  }),
  jsonParser: (req, res, next) => {
    const jsonParser = require("express").json({ limit: "2mb" });
    return jsonParser(req, res, next);
  },
  xssSanitizer: xssSanitizerMiddleware,
  rateLimit: generalRateLimiter,
};

module.exports = securityMiddlewares;
