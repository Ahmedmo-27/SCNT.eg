const crypto = require("crypto");
const logger = require("../utils/logger");

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded && typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || null;
}

const requestLogger = (req, res, next) => {
  const reqId = req.headers["x-request-id"] || crypto.randomUUID();
  req.id = reqId;
  res.setHeader("X-Request-Id", reqId);

  const startTime = Date.now();

  res.on("finish", () => {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;
    const ip = getClientIp(req);
    const userId = req.user?.userId || null;
    const method = req.method;
    const url = req.originalUrl || req.url;

    // Skip verbose logging for noisy static assets / health pings
    if (url === "/api/health" || url === "/favicon.ico") {
      return;
    }

    const meta = {
      context: "http",
      reqId,
      method,
      url,
      statusCode,
      responseTime,
      ip,
      userId,
      userAgent: req.headers["user-agent"] || "",
    };

    const message = `${method} ${url} ${statusCode} - ${responseTime}ms`;

    if (statusCode >= 500) {
      logger.error(`Server Error: ${message}`, meta);
    } else if (statusCode >= 400) {
      logger.warn(`Client Error: ${message}`, meta);
    } else if (responseTime > 1500) {
      logger.warn(`Slow Request (>1500ms): ${message}`, meta);
    } else {
      logger.http(message, meta);
    }
  });

  next();
};

module.exports = {
  requestLogger,
  getClientIp,
};
