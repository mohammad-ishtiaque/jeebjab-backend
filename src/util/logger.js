import path from "path";
import fs from "fs";
import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const { combine, timestamp, label, printf } = format;

// ─── Config ───────────────────────────────────────────
const PROJECT_LABEL = process.env.SERVICE_NAME || "APP";
const isDevelopment = process.env.NODE_ENV === "development";
const logDir = path.join(process.cwd(), "logs", "winston");

// ─── Log Directories বানাও যদি না থাকে ───────────────
const ensureLogDirs = () => {
  const dirs = [
    path.join(logDir, "successes"),
    path.join(logDir, "errors"),
  ];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};
ensureLogDirs();

// ─── Custom Format ────────────────────────────────────
const myFormat = printf(({ level, message, label, timestamp }) => {
  const date = new Date(timestamp);
  const h = String(date.getHours()).padStart(2, "0");   // Fix: 03 না 3
  const m = String(date.getMinutes()).padStart(2, "0"); // Fix: 09 না 9
  const s = String(date.getSeconds()).padStart(2, "0"); // Fix: 05 না 5

  return `${date.toDateString()} ${h}:${m}:${s} [${label}] ${level}: ${message}`;
});

// ─── Daily Rotate Config (Reusable) ───────────────────
const dailyRotateConfig = (level, filename) => ({
  level,
  filename: path.join(logDir, filename),
  datePattern: "YYYY-MM-DD-HH",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
});

// ─── General Logger ───────────────────────────────────
export const logger = createLogger({
  level: "info",
  format: combine(
    label({ label: PROJECT_LABEL }),
    timestamp(),
    myFormat
  ),
  transports: [
    // Development এ terminal এ দেখাবে
    ...(isDevelopment ? [new transports.Console()] : []),

    // সবসময় file এ save করবে
    new transports.File({
      level: "info",
      filename: path.join(logDir, "successes", "app-success.log"),
    }),
    new DailyRotateFile(
      dailyRotateConfig(
        "info",
        "successes/app-%DATE%-success.log"
      )
    ),
  ],
});

// ─── Error Logger ─────────────────────────────────────
export const errorLogger = createLogger({
  level: "error",
  format: combine(
    label({ label: PROJECT_LABEL }),
    timestamp(),
    myFormat
  ),
  transports: [
    // Development এ terminal এ দেখাবে
    ...(isDevelopment ? [new transports.Console()] : []),

    new DailyRotateFile(
      dailyRotateConfig(
        "error",
        "errors/app-%DATE%-error.log"
      )
    ),
  ],
});