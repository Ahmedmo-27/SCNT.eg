const CostConfig = require("../models/CostConfig");

/**
 * Helper to retrieve or initialize the singleton CostConfig
 */
async function getOrCreateCostConfig() {
  let config = await CostConfig.findOne({ key: "global" });
  if (!config) {
    config = await CostConfig.create({ key: "global" });
  } else if (config.liquids?.recipes?.size50ml?.oilMl === 15) {
    config.liquids.recipes.size50ml.oilMl = 12.5;
    if (config.liquids.recipes.size50ml.alcoholMl === 35) {
      config.liquids.recipes.size50ml.alcoholMl = 37.5;
    }
    await config.save();
  }
  return config;
}

/**
 * Standard default fallback parameters if cost config is missing or unseeded
 */
const DEFAULT_COST_CONFIG = {
  liquids: {
    fragrantAlcoholCostPerMl: 0.2,
    recipes: {
      size100ml: { oilMl: 25, alcoholMl: 75 },
      size50ml: { oilMl: 12.5, alcoholMl: 37.5 },
      decant3ml: { oilMl: 1, alcoholMl: 2 },
    },
  },
  bottles: {
    size100ml: 38,
    size50ml: 28,
    decant3mlVial: 6,
  },
  boxes: {
    size100ml: 22,
    size50ml: 16,
  },
  stickers: {
    bottleStickers: { unitCost: 5 },
    boxTopStickers: { unitCost: 2 },
    boxSealingStickers: { unitCost: 1.875 },
  },
  cards: {
    thankYouCard: { unitCost: 0.7 },
    decantCard: { unitCost: 0.9 },
  },
  wrapping: {
    wrappingSheetUnitCost: 2.5,
    shreddedPaper: { unitCostPerBox: 15 },
    courierFlyerUnitCost: 3,
  },
};

/**
 * Compute unit cost breakdown for standard 100ml, 50ml, and 3ml decant
 */
function computeStandardCogs(rawConfig, overrideOilPerMl = null) {
  const config = rawConfig || DEFAULT_COST_CONFIG;
  const liquids = config.liquids || DEFAULT_COST_CONFIG.liquids;
  const bottles = config.bottles || DEFAULT_COST_CONFIG.bottles;
  const boxes = config.boxes || DEFAULT_COST_CONFIG.boxes;
  const stickers = config.stickers || DEFAULT_COST_CONFIG.stickers;
  const cards = config.cards || DEFAULT_COST_CONFIG.cards;
  const wrapping = config.wrapping || DEFAULT_COST_CONFIG.wrapping;

  // Fragrance oils have NO default; each fragrance specifies its own oil cost unless configured on config
  const oilPerMl =
    overrideOilPerMl !== null && overrideOilPerMl !== undefined
      ? Number(overrideOilPerMl) || 0
      : liquids?.oilCostPerMl
      ? Number(liquids.oilCostPerMl) || 0
      : liquids?.oilCostPerKg
      ? Number(liquids.oilCostPerKg) / 1000
      : 0;
  const alcPerMl =
    liquids.fragrantAlcoholCostPerMl ||
    (liquids.fragrantAlcoholCostPerLiter ? liquids.fragrantAlcoholCostPerLiter / 1000 : 0.2);

  const bottleStickerUnit = stickers?.bottleStickers?.unitCost ?? 5;
  const boxTopStickerUnit = stickers?.boxTopStickers?.unitCost ?? 2;
  const boxSealingStickerUnit = stickers?.boxSealingStickers?.unitCost ?? 1.875;
  const thankYouCardUnit = cards?.thankYouCard?.unitCost ?? 0.7;
  const decantCardUnit = cards?.decantCard?.unitCost ?? 0.9;
  const wrappingSheetUnit = wrapping?.wrappingSheetUnitCost ?? 2.5;
  const shreddedPaperUnit = wrapping?.shreddedPaper?.unitCostPerBox ?? 15;
  const flyerUnit = wrapping?.courierFlyerUnitCost ?? 3;

  // 100ml Full Bottle Base Non-Oil Packaging & Liquid
  const alc100 = (liquids.recipes?.size100ml?.alcoholMl || 75) * alcPerMl;
  const bottle100 = bottles.size100ml ?? 38;
  const box100 = boxes.size100ml ?? 22;
  const stickers100 = bottleStickerUnit + boxTopStickerUnit + boxSealingStickerUnit;
  const packaging100 = wrappingSheetUnit + shreddedPaperUnit + thankYouCardUnit + flyerUnit;
  const baseNonOil100 = alc100 + bottle100 + box100 + stickers100 + packaging100;
  const oil100 = (liquids.recipes?.size100ml?.oilMl || 25) * oilPerMl;
  const total100ml = Number((oil100 + baseNonOil100).toFixed(2));

  // 50ml Full Bottle Base Non-Oil Packaging & Liquid
  const alc50 = (liquids.recipes?.size50ml?.alcoholMl ?? 37.5) * alcPerMl;
  const bottle50 = bottles.size50ml ?? 28;
  const box50 = boxes.size50ml ?? 16;
  const stickers50 = bottleStickerUnit + boxTopStickerUnit + boxSealingStickerUnit;
  const packaging50 = wrappingSheetUnit + shreddedPaperUnit + thankYouCardUnit + flyerUnit;
  const baseNonOil50 = alc50 + bottle50 + box50 + stickers50 + packaging50;
  const oil50 = (liquids.recipes?.size50ml?.oilMl ?? 12.5) * oilPerMl;
  const total50ml = Number((oil50 + baseNonOil50).toFixed(2));

  // 3ml Decant Unit COGS
  const decantOilMl = liquids.recipes?.decant3ml?.oilMl || 1;
  const decantAlcMl = liquids.recipes?.decant3ml?.alcoholMl || 2;
  const decantAlc = decantAlcMl * alcPerMl;
  const decantOil = decantOilMl * oilPerMl;
  const decantVial = bottles.decant3mlVial ?? 6;
  const decantCard = decantCardUnit;
  const baseNonOilDecant = decantAlc + decantVial + decantCard;
  const totalDecant3ml = Number((decantOil + baseNonOilDecant).toFixed(2));

  // Package Inclusions: 1 Thank You card with 2x 3ml Decants attached to it
  const packageDecants = {
    count: 2,
    description: "2x 3ml decants attached to the thank you card (1 purchased fragrance + 1 discovery fragrance)",
    vialsCost: Number((2 * decantVial).toFixed(2)),
    cardsCost: 0,
    alcoholCost: Number((2 * decantAlc).toFixed(2)),
    oilCost: Number((2 * decantOil).toFixed(2)),
    baseNonOilCost: Number((2 * (decantAlc + decantVial)).toFixed(2)),
    totalCost: Number((2 * (decantOil + decantAlc + decantVial)).toFixed(2)),
  };

  const package100mlTotalCogs = Number((total100ml + packageDecants.totalCost).toFixed(2));
  const package50mlTotalCogs = Number((total50ml + packageDecants.totalCost).toFixed(2));

  return {
    breakdowns: {
      size100ml: {
        oilCost: oil100,
        alcoholCost: alc100,
        bottleCost: bottle100,
        boxCost: box100,
        stickersCost: stickers100,
        stickerDetails: {
          bottleSticker: bottleStickerUnit,
          boxTopSticker: boxTopStickerUnit,
          boxSealingSticker: boxSealingStickerUnit,
        },
        packagingCost: packaging100,
        packagingDetails: {
          wrappingSheet: wrappingSheetUnit,
          shreddedPaper: shreddedPaperUnit,
          thankYouCard: thankYouCardUnit,
          courierFlyer: flyerUnit,
          decantVials: Number((2 * decantVial).toFixed(2)),
          packageDecantsTotal: packageDecants.totalCost,
        },
        packageDecants,
        packageTotalCogs: package100mlTotalCogs,
        baseNonOilCost: Number(baseNonOil100.toFixed(2)),
        totalCogs: total100ml,
      },
      size50ml: {
        oilCost: oil50,
        alcoholCost: alc50,
        bottleCost: bottle50,
        boxCost: box50,
        stickersCost: stickers50,
        stickerDetails: {
          bottleSticker: bottleStickerUnit,
          boxTopSticker: boxTopStickerUnit,
          boxSealingSticker: boxSealingStickerUnit,
        },
        packagingCost: packaging50,
        packagingDetails: {
          wrappingSheet: wrappingSheetUnit,
          shreddedPaper: shreddedPaperUnit,
          thankYouCard: thankYouCardUnit,
          courierFlyer: flyerUnit,
          decantVials: Number((2 * decantVial).toFixed(2)),
          packageDecantsTotal: packageDecants.totalCost,
        },
        packageDecants,
        packageTotalCogs: package50mlTotalCogs,
        baseNonOilCost: Number(baseNonOil50.toFixed(2)),
        totalCogs: total50ml,
      },
      decant3ml: {
        liquidCost: decantOil + decantAlc,
        oilCost: decantOil,
        alcoholCost: decantAlc,
        vialCost: decantVial,
        decantCardCost: decantCard,
        baseNonOilCost: Number(baseNonOilDecant.toFixed(2)),
        totalCogs: totalDecant3ml,
      },
    },
    unitCostsSummary: {
      bottleStickerFromMeter: bottleStickerUnit,
      boxSealingStickerFromSheet: boxSealingStickerUnit,
      boxTopSticker: boxTopStickerUnit,
      thankYouCard: thankYouCardUnit,
      decantCard: decantCardUnit,
      shreddedPaperPerBox: shreddedPaperUnit,
      fragrantAlcoholPerMl: alcPerMl,
      packageIncludedDecantsCost: packageDecants.totalCost,
      baseNonOil100ml: Number(baseNonOil100.toFixed(2)),
      baseNonOil50ml: Number(baseNonOil50.toFixed(2)),
      baseNonOilDecant3ml: Number(baseNonOilDecant.toFixed(2)),
    },
  };
}

/**
 * Normalize size strings like "100ml", "100 ml", "50ml", "3ml", "decant"
 */
function normalizeSize(rawSize) {
  if (!rawSize) return "100ml";
  const s = String(rawSize).toLowerCase().replace(/\s+/g, "");
  if (s.includes("50")) return "50ml";
  if (s.includes("3") || s.includes("decant")) return "3ml";
  return "100ml";
}

/**
 * Precompute COGS lookup tables for products
 */
function buildProductCogsMap(products = [], config) {
  const baseCogs = computeStandardCogs(config, 0).breakdowns;
  const defaultSizeCogs = {
    "100ml": baseCogs.size100ml.totalCogs,
    "50ml": baseCogs.size50ml.totalCogs,
    "3ml": baseCogs.decant3ml.totalCogs,
  };

  const productMap = new Map();

  for (const p of products) {
    if (!p) continue;
    const oilPerMl =
      p.oilCostPerMl > 0
        ? p.oilCostPerMl
        : p.oilCostPerKg > 0
        ? p.oilCostPerKg / 1000
        : 0;
    const breakdowns = computeStandardCogs(config, oilPerMl).breakdowns;
    const sizeCogs = {
      "100ml": breakdowns.size100ml.totalCogs,
      "50ml": breakdowns.size50ml.totalCogs,
      "3ml": breakdowns.decant3ml.totalCogs,
    };

    if (p._id) {
      productMap.set(p._id.toString(), sizeCogs);
    }
    if (p.slug) {
      productMap.set(p.slug, sizeCogs);
    }
    if (p.name) {
      productMap.set(p.name.toLowerCase().trim(), sizeCogs);
    }
  }

  return { productMap, defaultSizeCogs };
}

/**
 * Calculate unit COGS for an item given the product map and default fallbacks
 */
function getItemUnitCogs(item, productMap, defaultSizeCogs) {
  const sizeKey = normalizeSize(item.size);

  let sizeCogs = defaultSizeCogs[sizeKey] || defaultSizeCogs["100ml"];

  const prodKey =
    (item.product && item.product._id ? item.product._id.toString() : item.product ? item.product.toString() : null) ||
    (item.productName ? item.productName.toLowerCase().trim() : null);

  if (prodKey && productMap.has(prodKey)) {
    sizeCogs = productMap.get(prodKey)[sizeKey] ?? sizeCogs;
  }

  return sizeCogs;
}

/**
 * Calculate actual fragrance margin and gross sales for an array of online orders
 */
function calculateOrdersMarginAndSales(orders = [], productMap, defaultSizeCogs) {
  let totalMargin = 0;
  let totalSales = 0;
  let totalCogs = 0;
  let totalFragranceSales = 0;

  for (const order of orders) {
    if (!order || order.status === "CANCELLED") continue;

    const orderTotal = Number(order.total) || 0;
    const orderSubtotal =
      Number(order.subtotal) ||
      (order.items || []).reduce(
        (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
        0
      );
    const orderDiscount = Number(order.discount) || 0;
    const fragranceNetSales = Math.max(0, orderSubtotal - orderDiscount);

    let orderItemsCogs = 0;
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        const qty = Number(item.quantity) || 1;
        const unitCogs = getItemUnitCogs(item, productMap, defaultSizeCogs);
        orderItemsCogs += unitCogs * qty;
      }
    }

    const orderMargin = fragranceNetSales - orderItemsCogs;

    totalMargin += orderMargin;
    totalSales += orderTotal;
    totalCogs += orderItemsCogs;
    totalFragranceSales += fragranceNetSales;
  }

  return {
    margin: Number(totalMargin.toFixed(2)),
    sales: Number(totalSales.toFixed(2)),
    cogs: Number(totalCogs.toFixed(2)),
    fragranceSales: Number(totalFragranceSales.toFixed(2)),
  };
}

/**
 * Calculate actual fragrance margin and gross sales for an array of offline sales
 */
function calculateOfflineSalesMarginAndSales(offlineSales = [], productMap, defaultSizeCogs) {
  let totalMargin = 0;
  let totalSales = 0;
  let totalCogs = 0;
  let totalFragranceSales = 0;
  let totalUnits = 0;

  // Track product performance
  const productStatsMap = new Map();

  for (const sale of offlineSales) {
    if (!sale) continue;

    const saleTotal = Number(sale.total) || 0;
    const saleSubtotal =
      Number(sale.subtotal) ||
      (sale.items || []).reduce(
        (sum, it) =>
          sum + (Number(it.subtotal) || (Number(it.unitPrice) || 0) * (Number(it.quantity) || 1)),
        0
      );
    const saleDiscount = Number(sale.discount) || 0;
    const fragranceNetSales = Math.max(0, saleSubtotal - saleDiscount);

    let saleItemsCogs = 0;
    if (Array.isArray(sale.items)) {
      for (const item of sale.items) {
        const qty = Number(item.quantity) || 1;
        const unitCogs = getItemUnitCogs(item, productMap, defaultSizeCogs);
        const itemCogs = unitCogs * qty;
        const itemSubtotal =
          Number(item.subtotal) || (Number(item.unitPrice) || 0) * qty;

        saleItemsCogs += itemCogs;
        totalUnits += qty;

        // Attribute product stat
        const pName = item.productName || "Unknown Fragrance";
        const existing = productStatsMap.get(pName) || { quantity: 0, sales: 0, cogs: 0 };
        existing.quantity += qty;
        existing.sales += itemSubtotal;
        existing.cogs += itemCogs;
        productStatsMap.set(pName, existing);
      }
    }

    const saleMargin = fragranceNetSales - saleItemsCogs;

    totalMargin += saleMargin;
    totalSales += saleTotal;
    totalCogs += saleItemsCogs;
    totalFragranceSales += fragranceNetSales;
  }

  const topProducts = Array.from(productStatsMap.entries())
    .map(([productName, stats]) => ({
      productName,
      quantity: stats.quantity,
      revenue: Number((stats.sales - stats.cogs).toFixed(2)), // actual margin
      sales: Number(stats.sales.toFixed(2)),
      margin: Number((stats.sales - stats.cogs).toFixed(2)),
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  return {
    margin: Number(totalMargin.toFixed(2)),
    sales: Number(totalSales.toFixed(2)),
    cogs: Number(totalCogs.toFixed(2)),
    fragranceSales: Number(totalFragranceSales.toFixed(2)),
    totalUnits,
    topProducts,
  };
}

/**
 * Calculate unified storewide revenue and sales metrics
 */
function calculateStorewideRevenueAndSales({ orders = [], offlineSales = [], products = [], config }) {
  const { productMap, defaultSizeCogs } = buildProductCogsMap(products, config);

  const online = calculateOrdersMarginAndSales(orders, productMap, defaultSizeCogs);
  const offline = calculateOfflineSalesMarginAndSales(offlineSales, productMap, defaultSizeCogs);

  const totalRevenue = Number((online.margin + offline.margin).toFixed(2));
  const totalSales = Number((online.sales + offline.sales).toFixed(2));
  const totalCogs = Number((online.cogs + offline.cogs).toFixed(2));
  const marginPercent =
    totalSales > 0 ? Number(((totalRevenue / totalSales) * 100).toFixed(1)) : 0;

  return {
    totalRevenue, // Actual net margin from all fragrances sold online and offline
    onlineRevenue: online.margin, // Actual margin from online orders
    offlineRevenue: offline.margin, // Actual margin from offline sales
    totalSales, // Gross total sales volume
    onlineSales: online.sales,
    offlineSales: offline.sales,
    totalCogs,
    marginPercent,
  };
}

module.exports = {
  getOrCreateCostConfig,
  computeStandardCogs,
  normalizeSize,
  buildProductCogsMap,
  getItemUnitCogs,
  calculateOrdersMarginAndSales,
  calculateOfflineSalesMarginAndSales,
  calculateStorewideRevenueAndSales,
  DEFAULT_COST_CONFIG,
};
