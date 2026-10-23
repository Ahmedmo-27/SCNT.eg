const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        "OILS",
        "FRAGRANT_ALCOHOL",
        "CLEANING_ALCOHOL",
        "BOTTLES",
        "BOTTLES_50ML",
        "BOTTLES_100ML",
        "BOXES",
        "BOXES_50ML",
        "BOXES_100ML",
        "BOTTLE_STICKERS",      // bought by meter
        "BOX_SEALING_STICKERS", // sold by sheet
        "BOX_TOP_STICKERS",     // box lid sticker
        "THANK_YOU_CARDS",
        "DECANT_CARDS",
        "DECANTS_3ML",
        "WRAPPING_SHEETS",
        "SHREDDED_PAPER",       // 1 bag = ~3 boxes
        "LAB_TOOLS",            // beakers, syringes, scales, pipettes
        "PACKAGING_SHIPPING",   // couriers, tape, mailers
        "MARKETING_GIVEAWAYS",  // PR, promotional sample sets, influencer gifting
        "MISCELLANEOUS",
      ],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 }, // EGP
    quantity: { type: Number, default: 1, min: 0 },
    unit: {
      type: String,
      enum: [
        "meters",
        "sheets",
        "bags",       // for shredded paper
        "pcs",
        "kg",
        "grams",
        "liters",
        "ml",
        "units",
        "other",
      ],
      default: "units",
    },
    unitCost: { type: Number, default: 0 }, // auto-computed amount / quantity
    supplier: { type: String, default: "", trim: true },
    date: { type: Date, default: Date.now, index: true },
    invoiceNumber: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },

    // Promotional & Giveaway tracking (when category === 'MARKETING_GIVEAWAYS')
    promotionDetails: {
      campaignName: { type: String, default: "" },
      promoType: {
        type: String,
        enum: ["DECANTS", "BOTTLES_100ML", "BOTTLES_50ML", "MIXED"],
        default: "DECANTS",
      },
      bottles100mlGiven: { type: Number, default: 0 },
      bottles50mlGiven: { type: Number, default: 0 },
      decantUnitsGiven: { type: Number, default: 0 },
      totalUnitsGiven: { type: Number, default: 0 },
      decantUnitCostApplied: { type: Number, default: 0 },
      recipient: { type: String, default: "" },
      fragranceAllocations: [
        {
          product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
          productName: { type: String, default: "" },
          format: {
            type: String,
            enum: ["100ml", "50ml", "decant3ml"],
            default: "decant3ml",
          },
          quantity: { type: Number, default: 0 },
          unitCost: { type: Number, default: 0 },
          totalCost: { type: Number, default: 0 },
        },
      ],
      unassignedFormat: {
        type: String,
        enum: ["100ml", "50ml", "decant3ml"],
        default: "decant3ml",
      },
      unassignedQuantity: { type: Number, default: 0 },
      unassignedUnitCost: { type: Number, default: 0 },
    },

    assignedProduct: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// Pre-save hook to ensure unitCost is always up-to-date
expenseSchema.pre("save", function (next) {
  if (this.quantity && this.quantity > 0) {
    this.unitCost = Number((this.amount / this.quantity).toFixed(4));
  } else {
    this.unitCost = this.amount;
  }
  next();
});

module.exports = mongoose.model("Expense", expenseSchema);
