const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const ApiError = require("../utils/ApiError");
const Expense = require("../models/Expense");
const CostConfig = require("../models/CostConfig");
const Product = require("../models/Product");
const { recordAuditAction } = require("../utils/auditLogger");

/** Helper to retrieve or initialize the singleton CostConfig */
async function getOrCreateCostConfig() {
  let config = await CostConfig.findOne({ key: "global" });
  if (!config) {
    config = await CostConfig.create({ key: "global" });
  }
  return config;
}

/** Compute unit cost breakdown for standard 100ml, 50ml, and 3ml decant */
function computeStandardCogs(config, overrideOilPerMl = null) {
  const { liquids, bottles, boxes, stickers, cards, wrapping } = config;

  const oilPerMl =
    overrideOilPerMl != null && overrideOilPerMl > 0
      ? overrideOilPerMl
      : liquids.oilCostPerMl || liquids.oilCostPerKg / 1000 || 3;
  const alcPerMl = liquids.fragrantAlcoholCostPerMl || liquids.fragrantAlcoholCostPerLiter / 1000 || 0.2;

  const bottleStickerUnit = stickers?.bottleStickers?.unitCost || 5;
  const boxTopStickerUnit = stickers?.boxTopStickers?.unitCost || 2; // bought by the meter
  const boxSealingStickerUnit = stickers?.boxSealingStickers?.unitCost || 1.875;
  const thankYouCardUnit = cards?.thankYouCard?.unitCost || 0.7;
  const decantCardUnit = cards?.decantCard?.unitCost || 0.9;
  const wrappingSheetUnit = wrapping?.wrappingSheetUnitCost || 2.5;
  const shreddedPaperUnit = wrapping?.shreddedPaper?.unitCostPerBox || 15;
  const flyerUnit = wrapping?.courierFlyerUnitCost || 3;

  // 100ml Full Bottle COGS
  const oil100 = (liquids.recipes?.size100ml?.oilMl || 25) * oilPerMl;
  const alc100 = (liquids.recipes?.size100ml?.alcoholMl || 75) * alcPerMl;
  const bottle100 = bottles.size100ml || 38;
  const box100 = boxes.size100ml || 22;
  const stickers100 = bottleStickerUnit + boxTopStickerUnit + boxSealingStickerUnit;
  const packaging100 = wrappingSheetUnit + shreddedPaperUnit + thankYouCardUnit + flyerUnit;
  const total100ml = Number((oil100 + alc100 + bottle100 + box100 + stickers100 + packaging100).toFixed(2));

  // 50ml Full Bottle COGS
  const oil50 = (liquids.recipes?.size50ml?.oilMl || 15) * oilPerMl;
  const alc50 = (liquids.recipes?.size50ml?.alcoholMl || 35) * alcPerMl;
  const bottle50 = bottles.size50ml || 28;
  const box50 = boxes.size50ml || 16;
  const stickers50 = bottleStickerUnit + boxTopStickerUnit + boxSealingStickerUnit;
  const packaging50 = wrappingSheetUnit + shreddedPaperUnit + thankYouCardUnit + flyerUnit;
  const total50ml = Number((oil50 + alc50 + bottle50 + box50 + stickers50 + packaging50).toFixed(2));

  // 3ml Decant Unit COGS
  const decantOilMl = liquids.recipes?.decant3ml?.oilMl || 1;
  const decantAlcMl = liquids.recipes?.decant3ml?.alcoholMl || 2;
  const decantLiquid = decantOilMl * oilPerMl + decantAlcMl * alcPerMl;
  const decantVial = bottles.decant3mlVial || 6;
  const decantCard = decantCardUnit;
  const totalDecant3ml = Number((decantLiquid + decantVial + decantCard).toFixed(2));

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
        },
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
        },
        totalCogs: total50ml,
      },
      decant3ml: {
        liquidCost: decantLiquid,
        vialCost: decantVial,
        decantCardCost: decantCard,
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
      oilPerMl,
      fragrantAlcoholPerMl: alcPerMl,
    },
  };
}

/**
 * GET /api/admin/expenses
 * List expenses with pagination, category filter, date range, search query
 */
const listExpenses = asyncHandler(async (req, res) => {
  const { category, search, startDate, endDate, page = 1, limit = 25 } = req.query;

  const query = {};

  if (category && category !== "ALL") {
    query.category = category;
  }

  if (search && search.trim()) {
    const rx = new RegExp(search.trim(), "i");
    query.$or = [{ title: rx }, { supplier: rx }, { invoiceNumber: rx }, { notes: rx }];
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date.$lte = end;
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [items, total] = await Promise.all([
    Expense.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limitNum),
    Expense.countDocuments(query),
  ]);

  res.status(200).json(
    successResponse({
      items,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    })
  );
});

/**
 * GET /api/admin/expenses/summary
 * Total expenses, monthly breakdown, category aggregations, promotions totals
 */
const getExpenseSummary = asyncHandler(async (_req, res) => {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const [allTimeAgg, thisMonthAgg, lastMonthAgg, categoryAgg, promoAgg, monthlyTrend] = await Promise.all([
    Expense.aggregate([{ $group: { _id: null, totalSpent: { $sum: "$amount" }, count: { $sum: 1 } } }]),
    Expense.aggregate([
      { $match: { date: { $gte: startOfThisMonth } } },
      { $group: { _id: null, totalSpent: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Expense.aggregate([
      { $match: { date: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: null, totalSpent: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Expense.aggregate([
      {
        $group: {
          _id: "$category",
          totalAmount: { $sum: "$amount" },
          totalCount: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]),
    Expense.aggregate([
      { $match: { category: "MARKETING_GIVEAWAYS" } },
      {
        $group: {
          _id: null,
          totalPromoSCS: { $sum: "$amount" },
          totalDecantsGiven: { $sum: "$promotionDetails.decantUnitsGiven" },
          count: { $sum: 1 },
        },
      },
    ]),
    Expense.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]),
  ]);

  const totalSpent = allTimeAgg[0]?.totalSpent || 0;
  const thisMonthSpent = thisMonthAgg[0]?.totalSpent || 0;
  const lastMonthSpent = lastMonthAgg[0]?.totalSpent || 0;
  const totalPromoSCS = promoAgg[0]?.totalPromoSCS || 0;
  const totalDecantsGiven = promoAgg[0]?.totalDecantsGiven || 0;

  res.status(200).json(
    successResponse({
      totals: {
        totalSpent,
        thisMonthSpent,
        lastMonthSpent,
        totalPromoSCS,
        totalDecantsGiven,
        totalEntries: allTimeAgg[0]?.count || 0,
      },
      categoryBreakdown: categoryAgg.map((c) => ({
        category: c._id,
        totalAmount: c.totalAmount,
        count: c.totalCount,
        percentage: totalSpent > 0 ? Number(((c.totalAmount / totalSpent) * 100).toFixed(1)) : 0,
      })),
      monthlyTrend: monthlyTrend.reverse().map((m) => ({
        month: `${m._id.year}-${String(m._id.month).padStart(2, "0")}`,
        total: m.total,
        count: m.count,
      })),
    })
  );
});

/**
 * POST /api/admin/expenses
 * Create an expense entry, optionally syncing unit price to CostConfig
 */
const createExpense = asyncHandler(async (req, res) => {
  const {
    title,
    category,
    amount,
    quantity = 1,
    unit = "units",
    supplier = "",
    date = new Date(),
    invoiceNumber = "",
    notes = "",
    promotionDetails = {},
    syncWithCostConfig = false,
  } = req.body;

  if (!title || !category || amount == null || amount < 0) {
    throw new ApiError(400, "Title, valid category, and non-negative amount are required.");
  }

  const parsedQty = Number(quantity) > 0 ? Number(quantity) : 1;
  const parsedAmt = Number(amount);
  const computedUnitCost = Number((parsedAmt / parsedQty).toFixed(4));

  const expense = await Expense.create({
    title: title.trim(),
    category,
    amount: parsedAmt,
    quantity: parsedQty,
    unit,
    unitCost: computedUnitCost,
    supplier: supplier.trim(),
    date: date ? new Date(date) : new Date(),
    invoiceNumber: invoiceNumber.trim(),
    notes: notes.trim(),
    promotionDetails: {
      campaignName: promotionDetails.campaignName || "",
      decantUnitsGiven: Number(promotionDetails.decantUnitsGiven || 0),
      decantUnitCostApplied: Number(promotionDetails.decantUnitCostApplied || 0),
      recipient: promotionDetails.recipient || "",
    },
    recordedBy: req.user?._id || null,
  });

  // Optional sync: update CostConfig benchmarks based on this purchase
  if (syncWithCostConfig) {
    const config = await getOrCreateCostConfig();

    if (category === "BOTTLE_STICKERS" && unit === "meters") {
      // Amount is total for quantity meters => costPerMeter = computedUnitCost
      config.stickers.bottleStickers.costPerMeter = computedUnitCost;
    } else if (category === "BOX_SEALING_STICKERS" && unit === "sheets") {
      config.stickers.boxSealingStickers.costPerSheet = computedUnitCost;
    } else if (category === "BOX_TOP_STICKERS" && (unit === "meters" || unit === "sheets")) {
      config.stickers.boxTopStickers.costPerMeter = computedUnitCost;
    } else if (category === "SHREDDED_PAPER" && unit === "bags") {
      config.wrapping.shreddedPaper.costPerBag = computedUnitCost;
    } else if (category === "WRAPPING_SHEETS") {
      config.wrapping.wrappingSheetUnitCost = computedUnitCost;
    } else if (category === "FRAGRANT_ALCOHOL" && (unit === "liters" || unit === "other")) {
      config.liquids.fragrantAlcoholCostPerLiter = computedUnitCost;
      config.liquids.fragrantAlcoholCostPerMl = Number((computedUnitCost / 1000).toFixed(4));
    } else if (category === "CLEANING_ALCOHOL") {
      config.liquids.cleaningAlcoholCostPerLiter = computedUnitCost;
    } else if (category === "OILS" && (unit === "kg" || unit === "grams")) {
      if (unit === "kg") {
        config.liquids.oilCostPerKg = computedUnitCost;
        config.liquids.oilCostPerMl = Number((computedUnitCost / 1000).toFixed(4));
      } else {
        config.liquids.oilCostPerMl = computedUnitCost;
        config.liquids.oilCostPerKg = computedUnitCost * 1000;
      }
    }
    await config.save();
  }

  await recordAuditAction(req, {
    action: "EXPENSE_CREATE",
    targetType: "Expense",
    targetId: expense._id.toString(),
    details: { title: expense.title, category: expense.category, amount: expense.amount },
  });

  res.status(201).json(successResponse(expense, "Expense logged successfully"));
});

/**
 * POST /api/admin/expenses/log-decant-giveaway
 * Quick-action: log X gave-away 3ml decants with their decant cards as a promotional expense
 */
const logDecantGiveaway = asyncHandler(async (req, res) => {
  const { count = 1, campaignName = "Sample Giveaway", recipient = "", notes = "" } = req.body;

  const parsedCount = Math.max(1, parseInt(count, 10));
  const config = await getOrCreateCostConfig();
  const { breakdowns } = computeStandardCogs(config);
  const decantUnitCost = breakdowns.decant3ml.totalCogs;
  const totalAmount = Number((parsedCount * decantUnitCost).toFixed(2));

  const expense = await Expense.create({
    title: `3ml Decant Giveaway (${parsedCount} units - ${campaignName || "Promotion"})`,
    category: "MARKETING_GIVEAWAYS",
    amount: totalAmount,
    quantity: parsedCount,
    unit: "pcs",
    unitCost: decantUnitCost,
    supplier: "SCNT In-House Production",
    date: new Date(),
    notes: notes || `Distributed ${parsedCount} x 3ml decants with Decant Cards for marketing/promotion.`,
    promotionDetails: {
      campaignName: campaignName || "Giveaway Campaign",
      decantUnitsGiven: parsedCount,
      decantUnitCostApplied: decantUnitCost,
      recipient: recipient || "Marketing Distribution",
    },
    recordedBy: req.user?._id || null,
  });

  await recordAuditAction(req, {
    action: "DECANT_GIVEAWAY_LOG",
    targetType: "Expense",
    targetId: expense._id.toString(),
    details: { count: parsedCount, totalAmount, decantUnitCost },
  });

  res.status(201).json(
    successResponse(
      {
        expense,
        decantUnitCost,
        totalLogged: totalAmount,
      },
      `Logged ${parsedCount} decant giveaways (${totalAmount} EGP) into marketing expenses.`
    )
  );
});

/**
 * PUT /api/admin/expenses/:id
 */
const updateExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) throw new ApiError(404, "Expense entry not found.");

  const { title, category, amount, quantity, unit, supplier, date, invoiceNumber, notes, promotionDetails } = req.body;

  if (title) expense.title = title.trim();
  if (category) expense.category = category;
  if (amount != null) expense.amount = Number(amount);
  if (quantity != null) expense.quantity = Number(quantity);
  if (unit) expense.unit = unit;
  if (supplier !== undefined) expense.supplier = supplier.trim();
  if (date) expense.date = new Date(date);
  if (invoiceNumber !== undefined) expense.invoiceNumber = invoiceNumber.trim();
  if (notes !== undefined) expense.notes = notes.trim();

  if (promotionDetails) {
    expense.promotionDetails = {
      ...expense.promotionDetails,
      ...promotionDetails,
    };
  }

  await expense.save();

  await recordAuditAction(req, {
    action: "EXPENSE_UPDATE",
    targetType: "Expense",
    targetId: expense._id.toString(),
    details: { title: expense.title, category: expense.category, amount: expense.amount },
  });

  res.status(200).json(successResponse(expense, "Expense updated"));
});

/**
 * DELETE /api/admin/expenses/:id
 */
const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findByIdAndDelete(req.params.id);
  if (!expense) throw new ApiError(404, "Expense entry not found.");

  await recordAuditAction(req, {
    action: "EXPENSE_DELETE",
    targetType: "Expense",
    targetId: req.params.id,
    details: { title: expense.title, amount: expense.amount },
  });

  res.status(200).json(successResponse(null, "Expense removed"));
});

/**
 * GET /api/admin/cost-config
 * Retrieve current cost benchmark configuration and live unit calculations
 */
const getCostConfig = asyncHandler(async (_req, res) => {
  const config = await getOrCreateCostConfig();
  const cogsData = computeStandardCogs(config);

  res.status(200).json(
    successResponse({
      config,
      cogs: cogsData,
    })
  );
});

/**
 * PUT /api/admin/cost-config
 * Update material benchmark prices and formulas
 */
const updateCostConfig = asyncHandler(async (req, res) => {
  let config = await getOrCreateCostConfig();

  const { liquids, bottles, boxes, stickers, cards, wrapping } = req.body;

  if (liquids) {
    config.liquids = {
      ...config.liquids.toObject(),
      ...liquids,
      recipes: {
        ...config.liquids.recipes.toObject(),
        ...(liquids.recipes || {}),
      },
    };
  }

  if (bottles) {
    config.bottles = { ...config.bottles.toObject(), ...bottles };
  }

  if (boxes) {
    config.boxes = { ...config.boxes.toObject(), ...boxes };
  }

  if (stickers) {
    config.stickers = {
      ...config.stickers.toObject(),
      ...stickers,
      bottleStickers: {
        ...config.stickers.bottleStickers.toObject(),
        ...(stickers.bottleStickers || {}),
      },
      boxSealingStickers: {
        ...config.stickers.boxSealingStickers.toObject(),
        ...(stickers.boxSealingStickers || {}),
      },
      boxTopStickers: {
        ...config.stickers.boxTopStickers.toObject(),
        ...(stickers.boxTopStickers || {}),
      },
    };
  }

  if (cards) {
    config.cards = {
      ...config.cards.toObject(),
      ...cards,
      thankYouCard: {
        ...config.cards.thankYouCard.toObject(),
        ...(cards.thankYouCard || {}),
      },
      decantCard: {
        ...config.cards.decantCard.toObject(),
        ...(cards.decantCard || {}),
      },
    };
  }

  if (wrapping) {
    config.wrapping = {
      ...config.wrapping.toObject(),
      ...wrapping,
      shreddedPaper: {
        ...config.wrapping.shreddedPaper.toObject(),
        ...(wrapping.shreddedPaper || {}),
      },
    };
  }

  await config.save();
  const cogsData = computeStandardCogs(config);

  await recordAuditAction(req, {
    action: "COST_CONFIG_UPDATE",
    targetType: "CostConfig",
    targetId: config._id.toString(),
  });

  res.status(200).json(
    successResponse(
      {
        config,
        cogs: cogsData,
      },
      "Cost configuration and COGS benchmarks updated"
    )
  );
});

/**
 * PUT /api/admin/expenses/products/:id/oil-price
 * Update a specific fragrance's custom oil cost per kg or per ml
 */
const updateProductOilPrice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { oilCostPerKg, oilCostPerMl } = req.body;

  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, "Product not found.");

  if (oilCostPerKg !== undefined) {
    product.oilCostPerKg = Number(oilCostPerKg) || 0;
    if (!oilCostPerMl && product.oilCostPerKg > 0) {
      product.oilCostPerMl = Number((product.oilCostPerKg / 1000).toFixed(4));
    }
  }

  if (oilCostPerMl !== undefined && oilCostPerMl !== null) {
    product.oilCostPerMl = Number(oilCostPerMl) || 0;
    if (!oilCostPerKg && product.oilCostPerMl > 0) {
      product.oilCostPerKg = Number((product.oilCostPerMl * 1000).toFixed(2));
    }
  }

  await product.save();

  await recordAuditAction(req, {
    action: "PRODUCT_OIL_PRICE_UPDATE",
    targetType: "Product",
    targetId: product._id.toString(),
    details: { name: product.name, oilCostPerKg: product.oilCostPerKg, oilCostPerMl: product.oilCostPerMl },
  });

  const config = await getOrCreateCostConfig();
  const prodCogs = computeStandardCogs(config, product.oilCostPerMl);

  res.status(200).json(
    successResponse(
      {
        product: {
          _id: product._id,
          name: product.name,
          oilCostPerKg: product.oilCostPerKg,
          oilCostPerMl: product.oilCostPerMl,
        },
        cogs: prodCogs,
      },
      `Updated oil price for ${product.name}`
    )
  );
});

/**
 * GET /api/admin/cogs-analysis
 * Cross-references active products with computed COGS to calculate margin % and profit per item
 */
const getCogsAnalysis = asyncHandler(async (_req, res) => {
  const config = await getOrCreateCostConfig();
  const { breakdowns: globalBreakdowns } = computeStandardCogs(config);
  const products = await Product.find({})
    .select("name slug price size sizes stock oilCostPerKg oilCostPerMl SCNTcollection")
    .lean();

  const defaultOilPerMl = config.liquids.oilCostPerMl || config.liquids.oilCostPerKg / 1000 || 3;

  const productAnalysis = products.map((p) => {
    // Each fragrance uses its custom oil cost if set, else falls back to global default
    const prodOilPerMl =
      p.oilCostPerMl > 0
        ? p.oilCostPerMl
        : p.oilCostPerKg > 0
        ? p.oilCostPerKg / 1000
        : defaultOilPerMl;

    const prodCogs = computeStandardCogs(config, prodOilPerMl);
    const prodBreakdowns = prodCogs.breakdowns;

    // 100ml pricing or primary price
    const retailPrice100 = p.price || 750;
    const cogs100 = prodBreakdowns.size100ml.totalCogs;
    const profit100 = Number((retailPrice100 - cogs100).toFixed(2));
    const margin100 = retailPrice100 > 0 ? Number(((profit100 / retailPrice100) * 100).toFixed(1)) : 0;
    const markup100 = cogs100 > 0 ? Number((retailPrice100 / cogs100).toFixed(2)) : 0;

    // 50ml size if available
    const size50Option = p.sizes?.find((s) => s.size === "50ml");
    const retailPrice50 = size50Option?.price || 500;
    const cogs50 = prodBreakdowns.size50ml.totalCogs;
    const profit50 = Number((retailPrice50 - cogs50).toFixed(2));
    const margin50 = retailPrice50 > 0 ? Number(((profit50 / retailPrice50) * 100).toFixed(1)) : 0;

    return {
      _id: p._id,
      name: p.name,
      slug: p.slug,
      stock: p.stock,
      oilCostPerKg: p.oilCostPerKg || (p.oilCostPerMl ? p.oilCostPerMl * 1000 : 0),
      oilCostPerMl: prodOilPerMl,
      hasCustomOilPrice: Boolean(p.oilCostPerMl > 0 || p.oilCostPerKg > 0),
      breakdowns: prodBreakdowns,
      size100ml: {
        retailPrice: retailPrice100,
        cogs: cogs100,
        grossProfit: profit100,
        marginPercent: margin100,
        markupMultiplier: markup100,
      },
      size50ml: {
        retailPrice: retailPrice50,
        cogs: cogs50,
        grossProfit: profit50,
        marginPercent: margin50,
      },
      decant3ml: {
        cogs: prodBreakdowns.decant3ml.totalCogs,
      },
    };
  });

  res.status(200).json(
    successResponse({
      benchmarks: globalBreakdowns,
      productAnalysis,
      decant3mlAnalysis: {
        cogs: globalBreakdowns.decant3ml.totalCogs,
        breakdown: globalBreakdowns.decant3ml,
        suggestedSellingPrice: 120, // benchmark reference
        suggestedGrossProfit: Number((120 - globalBreakdowns.decant3ml.totalCogs).toFixed(2)),
        suggestedMarginPercent: Number((((120 - globalBreakdowns.decant3ml.totalCogs) / 120) * 100).toFixed(1)),
      },
    })
  );
});

module.exports = {
  listExpenses,
  getExpenseSummary,
  createExpense,
  logDecantGiveaway,
  updateExpense,
  deleteExpense,
  getCostConfig,
  updateCostConfig,
  updateProductOilPrice,
  getCogsAnalysis,
};
