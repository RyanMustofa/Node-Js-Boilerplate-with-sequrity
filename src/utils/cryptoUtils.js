const crypto = require("crypto");
const env = require("../config/env");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function normalizeKey(rawKey) {
  const key =
    rawKey || env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef";
  if (key.startsWith("base64:")) {
    return Buffer.from(key.replace("base64:", ""), "base64");
  }
  return Buffer.from(key.padEnd(32, "0").slice(0, 32));
}

function encryptSensitiveValue(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const key = normalizeKey(env.ENCRYPTION_KEY);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const plaintext = Buffer.from(String(value), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

function decryptSensitiveValue(payload) {
  if (!payload) {
    return null;
  }

  const buffer = Buffer.from(payload, "base64");
  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const key = normalizeKey(env.ENCRYPTION_KEY);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

function safeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

function createHmacSignature(secret, payload) {
  const normalized =
    typeof payload === "string" ? payload : JSON.stringify(payload);
  return crypto.createHmac("sha256", secret).update(normalized).digest("hex");
}

module.exports = {
  encryptSensitiveValue,
  decryptSensitiveValue,
  safeCompare,
  createHmacSignature,
};
