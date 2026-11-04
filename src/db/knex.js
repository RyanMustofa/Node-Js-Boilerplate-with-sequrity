const knex = require("knex");
const env = require("../config/env");

const config = {
  client: "mysql2",
  connection: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: "utf8mb4",
    timezone: "Z",
    ssl: env.DB_SSL ? { rejectUnauthorized: true } : false,
    connectionLimit: 10,
    acquireTimeoutMillis: 20000,
    timeout: 20000,
    multipleStatements: false,
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 60000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createTimeoutMillis: 30000,
  },
  debug: env.NODE_ENV === "development",
  useNullAsDefault: true,
};

const db = knex(config);

module.exports = db;
