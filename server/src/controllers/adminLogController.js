const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const ApiError = require("../utils/ApiError");
const Log = require("../models/Log");
const { recordAuditAction } = require("../utils/auditLogger");

/**
 * Admin: List logs with pagination, search, and filters
 */
const listLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
  const skip = (page - 1) * limit;

  const filter = {};

  if (req.query.level && req.query.level !== "all") {
    filter.level = req.query.level;
  }

  if (req.query.context && req.query.context !== "all") {
    filter.context = req.query.context;
  }

  if (req.query.search) {
    const searchRegex = new RegExp(String(req.query.search).trim(), "i");
    filter.$or = [
      { message: searchRegex },
      { url: searchRegex },
      { ip: searchRegex },
      { reqId: searchRegex },
    ];
  }

  if (req.query.startDate || req.query.endDate) {
    filter.createdAt = {};
    if (req.query.startDate) {
      filter.createdAt.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      filter.createdAt.$lte = new Date(req.query.endDate);
    }
  }

  const [items, total] = await Promise.all([
    Log.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "full_name email role")
      .lean(),
    Log.countDocuments(filter),
  ]);

  res.status(200).json(
    successResponse({
      items,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    })
  );
});

/**
 * Admin: Summary statistics for logs
 */
const getLogStats = asyncHandler(async (_req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [errorsToday, warningsToday, auditToday, totalLogs] = await Promise.all([
    Log.countDocuments({ level: "error", createdAt: { $gte: todayStart } }),
    Log.countDocuments({ level: "warn", createdAt: { $gte: todayStart } }),
    Log.countDocuments({ level: "audit", createdAt: { $gte: todayStart } }),
    Log.estimatedDocumentCount(),
  ]);

  res.status(200).json(
    successResponse({
      errorsToday,
      warningsToday,
      auditToday,
      totalLogs,
    })
  );
});

/**
 * Admin: Export logs as JSON
 */
const exportLogs = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.level && req.query.level !== "all") {
    filter.level = req.query.level;
  }
  if (req.query.context && req.query.context !== "all") {
    filter.context = req.query.context;
  }
  if (req.query.startDate) {
    filter.createdAt = { $gte: new Date(req.query.startDate) };
  }

  const logs = await Log.find(filter)
    .sort({ createdAt: -1 })
    .limit(1000)
    .populate("userId", "full_name email")
    .lean();

  res.setHeader("Content-Disposition", `attachment; filename=scnt-logs-${Date.now()}.json`);
  res.setHeader("Content-Type", "application/json");
  res.status(200).send(JSON.stringify(logs, null, 2));
});

/**
 * Admin: Purge older logs manually
 */
const clearLogs = asyncHandler(async (req, res) => {
  const olderThanDays = Math.max(1, Number(req.body?.olderThanDays || req.query?.olderThanDays || 7));
  const cutoffDate = new Date();

  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await Log.deleteMany({
    createdAt: { $lt: cutoffDate },
    level: { $ne: "audit" }, // Never delete audit logs via bulk clear
  });

  await recordAuditAction(req, {
    action: "LOGS_PURGED",
    targetType: "SystemLog",
    details: {
      deletedCount: result.deletedCount,
      olderThanDays,
      cutoffDate,
    },
  });

  res.status(200).json(
    successResponse(
      { deletedCount: result.deletedCount },
      `Cleared ${result.deletedCount} logs older than ${olderThanDays} days`
    )
  );
});

module.exports = {
  listLogs,
  getLogStats,
  exportLogs,
  clearLogs,
};
