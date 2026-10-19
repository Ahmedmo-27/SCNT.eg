const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const LOGS_DIR = path.resolve(__dirname, "../../logs");
const ERROR_LOG_PATH = path.join(LOGS_DIR, "error.log");
const COMBINED_LOG_PATH = path.join(LOGS_DIR, "combined.log");
const MAX_LOG_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file before simple rotation

// Ensure logs directory exists
try {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
} catch (err) {
  console.error("Failed to initialize logs directory:", err.message);
}

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "authorization",
  "secret",
  "creditcard",
  "cardnumber",
  "cvv",
  "refreshtoken",
  "smtp_pass",
]);

function sanitize(data, depth = 0) {
  if (!data || depth > 4) return data;
  if (typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitize(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else if (value && typeof value === "object") {
      sanitized[key] = sanitize(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function rotateIfNeeded(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > MAX_LOG_FILE_SIZE) {
        const backupPath = `${filePath}.${Date.now()}.bak`;
        fs.renameSync(filePath, backupPath);
      }
    }
  } catch (err) {
    // Non-fatal
  }
}

function writeToFile(filePath, logLine) {
  try {
    rotateIfNeeded(filePath);
    fs.appendFileSync(filePath, `${logLine}\n`, "utf8");
  } catch (err) {
    // Never let logging crashes bring down the server
    console.error("Failed writing to log file:", err.message);
  }
}

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  gray: "\x1b[90m",
};

const levelColors = {
  error: colors.red,
  warn: colors.yellow,
  info: colors.cyan,
  http: colors.green,
  audit: colors.magenta,
  debug: colors.gray,
};

// Lazy model loader to avoid circular dependency before DB connects
let LogModel = null;
function getLogModel() {
  if (!LogModel) {
    try {
      LogModel = require("../models/Log");
    } catch {
      LogModel = null;
    }
  }
  return LogModel;
}

async function persistToDb(level, message, meta = {}) {
  try {
    if (mongoose.connection.readyState !== 1) return; // DB not ready
    const Model = getLogModel();
    if (!Model) return;

    const payload = {
      level,
      message,
      context: meta.context || "system",
      reqId: meta.reqId || null,
      method: meta.method || null,
      url: meta.url || null,
      statusCode: meta.statusCode ? Number(meta.statusCode) : null,
      responseTime: meta.responseTime ? Number(meta.responseTime) : null,
      ip: meta.ip || null,
      userId: meta.userId || null,
      metadata: sanitize(meta.metadata || meta),
    };

    // Remove top-level redundant keys from nested metadata
    if (payload.metadata && typeof payload.metadata === "object") {
      delete payload.metadata.context;
      delete payload.metadata.reqId;
      delete payload.metadata.method;
      delete payload.metadata.url;
      delete payload.metadata.statusCode;
      delete payload.metadata.responseTime;
      delete payload.metadata.ip;
      delete payload.metadata.userId;
      if (Object.keys(payload.metadata).length === 0) {
        payload.metadata = null;
      }
    }

    await Model.create(payload);
  } catch (err) {
    // Fail silently so database log errors never disrupt client requests
  }
}

function log(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const color = levelColors[level] || colors.reset;
  const context = meta.context ? `[${meta.context}]` : "";
  const reqIdStr = meta.reqId ? `(${meta.reqId})` : "";

  // 1. Console Output
  const consolePrefix = `${colors.gray}${timestamp}${colors.reset} ${color}[${level.toUpperCase()}]${colors.reset} ${colors.yellow}${context}${colors.reset} ${reqIdStr}`;
  if (level === "error") {
    console.error(`${consolePrefix} ${message}`, meta.stack ? `\n${meta.stack}` : "");
  } else if (level === "warn") {
    console.warn(`${consolePrefix} ${message}`);
  } else {
    console.log(`${consolePrefix} ${message}`);
  }

  // 2. Structured File Logging (JSON Lines)
  const logEntry = {
    timestamp,
    level,
    message,
    context: meta.context || "system",
    reqId: meta.reqId || null,
    method: meta.method || null,
    url: meta.url || null,
    statusCode: meta.statusCode || null,
    responseTime: meta.responseTime || null,
    ip: meta.ip || null,
    userId: meta.userId || null,
    metadata: sanitize(meta.metadata || (meta.stack ? { stack: meta.stack } : null)),
  };

  const line = JSON.stringify(logEntry);
  writeToFile(COMBINED_LOG_PATH, line);
  if (level === "error") {
    writeToFile(ERROR_LOG_PATH, line);
  }

  // 3. Database Persistence (Async, non-blocking)
  // Store all errors, warnings, audit events, and general info/http
  if (["error", "warn", "info", "audit"].includes(level)) {
    persistToDb(level, message, meta).catch(() => {});
  }
}

const logger = {
  error: (msg, meta) => {
    if (msg instanceof Error) {
      log("error", msg.message, { ...meta, stack: msg.stack });
    } else {
      log("error", msg, meta);
    }
  },
  warn: (msg, meta) => log("warn", msg, meta),
  info: (msg, meta) => log("info", msg, meta),
  http: (msg, meta) => log("http", msg, meta),
  audit: (msg, meta) => log("audit", msg, meta),
  debug: (msg, meta) => {
    if (process.env.NODE_ENV !== "production") {
      log("debug", msg, meta);
    }
  },
};

module.exports = logger;
