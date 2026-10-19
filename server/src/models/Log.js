const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ["error", "warn", "info", "http", "audit", "debug"],
      default: "info",
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    context: {
      type: String,
      default: "system",
      index: true,
      trim: true,
    },
    reqId: {
      type: String,
      default: null,
      index: true,
    },
    method: {
      type: String,
      default: null,
    },
    url: {
      type: String,
      default: null,
    },
    statusCode: {
      type: Number,
      default: null,
      index: true,
    },
    responseTime: {
      type: Number,
      default: null,
    },
    ip: {
      type: String,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically remove logs older than 30 days (default)
const logRetentionSeconds = Number(process.env.LOG_RETENTION_DAYS || 30) * 24 * 60 * 60;
logSchema.index({ createdAt: 1 }, { expireAfterSeconds: logRetentionSeconds });
logSchema.index({ level: 1, createdAt: -1 });
logSchema.index({ context: 1, createdAt: -1 });

module.exports = mongoose.model("Log", logSchema);
