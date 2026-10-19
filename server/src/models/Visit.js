const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema(
  {
    visitorId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    path: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    referrer: {
      type: String,
      default: "",
      trim: true,
    },
    referrerDomain: {
      type: String,
      default: "direct",
      index: true,
      trim: true,
    },
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: "",
    },
    device: {
      type: String,
      enum: ["mobile", "tablet", "desktop"],
      default: "desktop",
      index: true,
    },
    browser: {
      type: String,
      default: "Unknown",
      index: true,
    },
    os: {
      type: String,
      default: "Unknown",
      index: true,
    },
    screenResolution: {
      type: String,
      default: null,
    },
    locale: {
      type: String,
      default: "en",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
      index: true,
    },
    isBot: {
      type: Boolean,
      default: false,
      index: true,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically remove visit records older than 90 days (default)
const visitRetentionSeconds = Number(process.env.VISIT_RETENTION_DAYS || 90) * 24 * 60 * 60;
visitSchema.index({ createdAt: 1 }, { expireAfterSeconds: visitRetentionSeconds });
visitSchema.index({ createdAt: -1, isAdmin: 1, isBot: 1 });
visitSchema.index({ path: 1, createdAt: -1 });

module.exports = mongoose.model("Visit", visitSchema);
