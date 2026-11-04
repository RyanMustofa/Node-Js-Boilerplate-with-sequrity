require("dotenv").config();

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 3000),
  TRUST_PROXY: Number(process.env.TRUST_PROXY || 1),
  JWT_SECRET: process.env.JWT_SECRET || "change_me_in_production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h",
  API_MASTER_KEY: process.env.API_MASTER_KEY || "dev_master_key",
  API_SIGNATURE_SECRET:
    process.env.API_SIGNATURE_SECRET || "dev_signature_secret",
  PAYOUT_API_KEY: process.env.PAYOUT_API_KEY || "dev_payout_key",
  PAYOUT_SIGNATURE_SECRET:
    process.env.PAYOUT_SIGNATURE_SECRET || "dev_payout_signature_secret",
  DB_HOST: process.env.DB_HOST || "127.0.0.1",
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_NAME: process.env.DB_NAME || "app_db",
  DB_USER: process.env.DB_USER || "app_user",
  DB_PASSWORD: process.env.DB_PASSWORD || "change_me",
  DB_SSL: process.env.DB_SSL === "true",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  ENCRYPTION_KEY:
    process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef",
};

module.exports = env;
