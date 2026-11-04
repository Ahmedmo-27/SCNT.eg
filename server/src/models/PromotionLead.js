const mongoose = require("mongoose");

const promotionLeadSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PromotionCampaign",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    promoCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    visitorId: {
      type: String,
      default: "",
    },
    ip: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
    locale: {
      type: String,
      default: "en",
    },
    claimedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Prevent duplicate lead rows for the same campaign + email
promotionLeadSchema.index({ campaign: 1, email: 1 }, { unique: true });

module.exports = mongoose.model("PromotionLead", promotionLeadSchema);
