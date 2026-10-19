const { errorResponse } = require("../utils/apiResponse");
const logger = require("../utils/logger");
const { getClientIp } = require("./requestLogger");

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  logger.error(err.message || "Unhandled Request Error", {
    context: "error-handler",
    reqId: req?.id || null,
    method: req?.method || null,
    url: req?.originalUrl || req?.url || null,
    statusCode,
    ip: req ? getClientIp(req) : null,
    userId: req?.user?.userId || null,
    stack: err.stack,
    metadata: {
      errorName: err.name,
      errors: err.errors || null,
    },
  });

  res.status(statusCode).json(errorResponse(message));
};

module.exports = errorHandler;

