const fs = require("fs");
const path = require("path");
const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const env = require("../config/env");

const logDir = path.join(__dirname, "../../storage/logs");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
      const details = Object.keys(meta).length
        ? ` ${JSON.stringify(meta)}`
        : "";
      return `${timestamp} ${level.toUpperCase()}: ${message}${details}`;
    }),
  ),
  transports: [
    new winston.transports.Console(),
    new DailyRotateFile({
      filename: path.join(logDir, "app-%DATE%"),
      datePattern: "YYYY-MM-DD",
      extension: ".log",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "30d",
      createDir: true,
    }),
  ],
});

module.exports = logger;
