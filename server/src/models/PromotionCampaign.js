const mongoose = require("mongoose");

const localizedTextSchema = new mongoose.Schema(
  {
    en: { type: String, default: "", trim: true },
    ar: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const promotionCampaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["SPECIAL_EVENT", "DEFAULT_WELCOME"],
      default: "SPECIAL_EVENT",
      index: true,
    },
    badge: {
      type: localizedTextSchema,
      default: () => ({ en: "Limited Offer", ar: "عرض خاص" }),
    },
    title: {
      type: localizedTextSchema,
      required: true,
      default: () => ({ en: "", ar: "" }),
    },
    subtitle: {
      type: localizedTextSchema,
      default: () => ({ en: "", ar: "" }),
    },
    description: {
      type: localizedTextSchema,
      default: () => ({ en: "", ar: "" }),
    },
    discountHighlight: {
      type: localizedTextSchema,
      default: () => ({ en: "20% OFF", ar: "خصم 20%" }),
    },
    ctaText: {
      type: localizedTextSchema,
      default: () => ({ en: "Claim My Discount", ar: "احصل على كود الخصم" }),
    },

    // Linked promo code details
    promoCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FIXED"],
      default: "PERCENTAGE",
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
      default: 10,
    },
    minSubtotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Scheduling (primarily for SPECIAL_EVENT)
    startsAt: {
      type: Date,
      default: null,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },

    // Visibility & Styling
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    showModal: {
      type: Boolean,
      default: true,
    },
    theme: {
      type: String,
      enum: ["black_friday", "gold_luxury", "minimal_dark"],
      default: "black_friday",
    },

    // Email delivery overrides (optional)
    emailSubject: {
      type: localizedTextSchema,
      default: () => ({ en: "", ar: "" }),
    },
    emailHeadline: {
      type: localizedTextSchema,
      default: () => ({ en: "", ar: "" }),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PromotionCampaign", promotionCampaignSchema);
