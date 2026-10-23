const mongoose = require("mongoose");

const costConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: "global", unique: true },

    // Fragrance formulation (Fragrance Oil + Fragrant Alcohol + Cleaning Alcohol)
    liquids: {
      oilCostPerKg: { type: Number, default: 3000 },
      oilCostPerMl: { type: Number, default: 3 }, // derived or custom: EGP/ml
      fragrantAlcoholCostPerLiter: { type: Number, default: 200 },
      fragrantAlcoholCostPerMl: { type: Number, default: 0.2 }, // EGP/ml
      cleaningAlcoholCostPerLiter: { type: Number, default: 80 },

      // Standard recipes (ml of oil and fragrant alcohol per product size)
      recipes: {
        size50ml: {
          oilMl: { type: Number, default: 15 },
          alcoholMl: { type: Number, default: 35 },
        },
        size100ml: {
          oilMl: { type: Number, default: 25 },
          alcoholMl: { type: Number, default: 75 },
        },
        decant3ml: {
          oilMl: { type: Number, default: 1 },
          alcoholMl: { type: Number, default: 2 },
        },
      },
    },

    // Bottles & Decant Vials
    bottles: {
      size50ml: { type: Number, default: 28 }, // EGP per bottle
      size100ml: { type: Number, default: 38 }, // EGP per bottle
      decant3mlVial: { type: Number, default: 6 }, // EGP per 3ml vial
    },

    // Outer Boxes
    boxes: {
      size50ml: { type: Number, default: 16 }, // EGP per box
      size100ml: { type: Number, default: 22 }, // EGP per box
    },

    // Stickers (3 types with their distinct purchasing mechanisms)
    stickers: {
      // 1. Bottle Stickers: Bought BY THE METER
      bottleStickers: {
        costPerMeter: { type: Number, default: 75 },
        stickersPerMeter: { type: Number, default: 15 }, // Yield: 15 stickers per meter
        unitCost: { type: Number, default: 5 }, // 75 / 15 = 5 EGP
      },
      // 2. Box Sealing Stickers: Sold BY THE SHEET
      boxSealingStickers: {
        costPerSheet: { type: Number, default: 45 },
        stickersPerSheet: { type: Number, default: 24 }, // Yield: 24 stickers per sheet
        unitCost: { type: Number, default: 1.875 }, // 45 / 24 = 1.875 EGP
      },
      // 3. Box Top Stickers: Lid sticker (sheet-based)
      boxTopStickers: {
        costPerSheet: { type: Number, default: 30 },
        stickersPerSheet: { type: Number, default: 20 }, // Yield: 20 stickers per sheet
        unitCost: { type: Number, default: 1.5 }, // 30 / 20 = 1.5 EGP
      },
    },

    // Cards (Two distinct types)
    cards: {
      thankYouCard: {
        batchCost: { type: Number, default: 350 },
        batchQuantity: { type: Number, default: 500 },
        unitCost: { type: Number, default: 0.7 }, // 350 / 500 = 0.70 EGP
      },
      decantCard: {
        batchCost: { type: Number, default: 450 },
        batchQuantity: { type: Number, default: 500 },
        unitCost: { type: Number, default: 0.9 }, // 450 / 500 = 0.90 EGP
      },
    },

    // Wrapping & Box Filler
    wrapping: {
      wrappingSheetUnitCost: { type: Number, default: 2.5 }, // 1 sheet per box
      shreddedPaper: {
        costPerBag: { type: Number, default: 45 },
        boxesPerBag: { type: Number, default: 3 }, // 1 bag makes ~3 boxes
        unitCostPerBox: { type: Number, default: 15 }, // 45 / 3 = 15 EGP
      },
      courierFlyerUnitCost: { type: Number, default: 3 }, // shipping flyer/outer mailer
    },

    currency: { type: String, default: "EGP" },
  },
  { timestamps: true }
);

// Pre-save calculation helper to auto-compute derived unit costs
costConfigSchema.pre("save", function (next) {
  // Bottle stickers (meter)
  if (this.stickers?.bottleStickers?.stickersPerMeter > 0) {
    this.stickers.bottleStickers.unitCost = Number(
      (this.stickers.bottleStickers.costPerMeter / this.stickers.bottleStickers.stickersPerMeter).toFixed(4)
    );
  }
  // Box sealing stickers (sheet)
  if (this.stickers?.boxSealingStickers?.stickersPerSheet > 0) {
    this.stickers.boxSealingStickers.unitCost = Number(
      (this.stickers.boxSealingStickers.costPerSheet / this.stickers.boxSealingStickers.stickersPerSheet).toFixed(4)
    );
  }
  // Box top stickers (sheet)
  if (this.stickers?.boxTopStickers?.stickersPerSheet > 0) {
    this.stickers.boxTopStickers.unitCost = Number(
      (this.stickers.boxTopStickers.costPerSheet / this.stickers.boxTopStickers.stickersPerSheet).toFixed(4)
    );
  }
  // Thank you cards
  if (this.cards?.thankYouCard?.batchQuantity > 0) {
    this.cards.thankYouCard.unitCost = Number(
      (this.cards.thankYouCard.batchCost / this.cards.thankYouCard.batchQuantity).toFixed(4)
    );
  }
  // Decant cards
  if (this.cards?.decantCard?.batchQuantity > 0) {
    this.cards.decantCard.unitCost = Number(
      (this.cards.decantCard.batchCost / this.cards.decantCard.batchQuantity).toFixed(4)
    );
  }
  // Shredded paper per box (cost per bag / boxes per bag)
  if (this.wrapping?.shreddedPaper?.boxesPerBag > 0) {
    this.wrapping.shreddedPaper.unitCostPerBox = Number(
      (this.wrapping.shreddedPaper.costPerBag / this.wrapping.shreddedPaper.boxesPerBag).toFixed(4)
    );
  }
  // Oil per ml if oilCostPerKg given
  if (this.liquids?.oilCostPerKg > 0 && (!this.liquids.oilCostPerMl || this.liquids.oilCostPerMl === 0)) {
    this.liquids.oilCostPerMl = Number((this.liquids.oilCostPerKg / 1000).toFixed(4));
  }
  // Fragrant alcohol per ml
  if (this.liquids?.fragrantAlcoholCostPerLiter > 0) {
    this.liquids.fragrantAlcoholCostPerMl = Number((this.liquids.fragrantAlcoholCostPerLiter / 1000).toFixed(4));
  }
  next();
});

module.exports = mongoose.model("CostConfig", costConfigSchema);
