const mongoose = require("mongoose");

const applicableProductSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    maxCount: {
      type: Number,
      default: null,
      min: 1,
    },
    sizes: {
      type: [String],
      default: [], // e.g. ["50ml"], ["100ml"], or [] for all sizes
    },
  },
  { _id: false }
);

const promoCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FIXED"],
      required: true,
      default: "PERCENTAGE",
    },
    discountValue: { type: Number, required: true, min: 0 },
    discountScope: {
      type: String,
      enum: ["CERTAIN_PRODUCTS", "WHOLE_CART"],
      default: "CERTAIN_PRODUCTS",
    },
    applicableSizes: {
      type: [String],
      default: [], // Global size restriction: e.g. ["50ml"]
    },
    minSubtotal: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, default: null, min: 0 },
    applicableProducts: {
      type: [applicableProductSchema],
      default: [],
    },
    isActive: { type: Boolean, default: true, index: true },
    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PromoCode", promoCodeSchema);
