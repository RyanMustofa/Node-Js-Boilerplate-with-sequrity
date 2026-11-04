const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { safeCompare, createHmacSignature } = require("../utils/cryptoUtils");

function getClientIp(req) {
  const forwardedIp = req.headers["x-forwarded-for"];
  if (typeof forwardedIp === "string" && forwardedIp.trim()) {
    return forwardedIp.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
}

function apiTokenAuth(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  const signature = req.headers["x-signature"];
  const body = req.body ? JSON.stringify(req.body) : "";

  if (!apiKey || !signature) {
    return res.status(401).json({ error: "Missing API credentials" });
  }

  const expectedApiKey = env.API_MASTER_KEY;
  const expectedSignature = createHmacSignature(env.API_SIGNATURE_SECRET, body);

  const apiKeyMatches = safeCompare(String(apiKey), String(expectedApiKey));
  const signatureMatches = safeCompare(
    String(signature),
    String(expectedSignature),
  );

  if (!apiKeyMatches || !signatureMatches) {
    return res.status(401).json({ error: "Invalid API credentials" });
  }

  req.auth = { ...req.auth, api: { key: apiKey, ip: getClientIp(req) } };
  next();
}

function apiTokenAuthPayout(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  const signature = req.headers["x-signature"];
  const payload = req.body ? JSON.stringify(req.body) : "";

  if (!apiKey || !signature) {
    return res.status(401).json({ error: "Missing payout API credentials" });
  }

  const expectedApiKey = env.PAYOUT_API_KEY;
  const expectedSignature = createHmacSignature(
    env.PAYOUT_SIGNATURE_SECRET,
    payload,
  );

  const apiKeyMatches = safeCompare(String(apiKey), String(expectedApiKey));
  const signatureMatches = safeCompare(
    String(signature),
    String(expectedSignature),
  );

  if (!apiKeyMatches || !signatureMatches) {
    return res.status(401).json({ error: "Invalid payout API credentials" });
  }

  req.auth = { ...req.auth, payout: { key: apiKey, ip: getClientIp(req) } };
  next();
}

function requireJwtAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = {
  apiTokenAuth,
  apiTokenAuthPayout,
  requireJwtAuth,
  getClientIp,
};
