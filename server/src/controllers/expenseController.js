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
function computeStandardCogs(config, overrideOilPerMl = 0) {
  const { liquids, bottles, boxes, stickers, cards, wrapping } = config;

  // Fragrance oils have NO default; each fragrance specifies its own oil cost
  const oilPerMl = Number(overrideOilPerMl) || 0;
  const alcPerMl = liquids.fragrantAlcoholCostPerMl || liquids.fragrantAlcoholCostPerLiter / 1000 || 0.2;

  const bottleStickerUnit = stickers?.bottleStickers?.unitCost || 5;
  const boxTopStickerUnit = stickers?.boxTopStickers?.unitCost || 2; // bought by the meter
  const boxSealingStickerUnit = stickers?.boxSealingStickers?.unitCost || 1.875;
  const thankYouCardUnit = cards?.thankYouCard?.unitCost || 0.7;
  const decantCardUnit = cards?.decantCard?.unitCost || 0.9;
  const wrappingSheetUnit = wrapping?.wrappingSheetUnitCost || 2.5;
  const shreddedPaperUnit = wrapping?.shreddedPaper?.unitCostPerBox || 15;
  const flyerUnit = wrapping?.courierFlyerUnitCost || 3;

  // 100ml Full Bottle Base Non-Oil Packaging & Liquid
  const alc100 = (liquids.recipes?.size100ml?.alcoholMl || 75) * alcPerMl;
  const bottle100 = bottles.size100ml || 38;
  const box100 = boxes.size100ml || 22;
  const stickers100 = bottleStickerUnit + boxTopStickerUnit + boxSealingStickerUnit;
  const packaging100 = wrappingSheetUnit + shreddedPaperUnit + thankYouCardUnit + flyerUnit;
  const baseNonOil100 = alc100 + bottle100 + box100 + stickers100 + packaging100;
  const oil100 = (liquids.recipes?.size100ml?.oilMl || 25) * oilPerMl;
  const total100ml = Number((oil100 + baseNonOil100).toFixed(2));

  // 50ml Full Bottle Base Non-Oil Packaging & Liquid
  const alc50 = (liquids.recipes?.size50ml?.alcoholMl || 35) * alcPerMl;
  const bottle50 = bottles.size50ml || 28;
  const box50 = boxes.size50ml || 16;
  const stickers50 = bottleStickerUnit + boxTopStickerUnit + boxSealingStickerUnit;
  const packaging50 = wrappingSheetUnit + shreddedPaperUnit + thankYouCardUnit + flyerUnit;
  const baseNonOil50 = alc50 + bottle50 + box50 + stickers50 + packaging50;
  const oil50 = (liquids.recipes?.size50ml?.oilMl || 15) * oilPerMl;
  const total50ml = Number((oil50 + baseNonOil50).toFixed(2));

  // 3ml Decant Unit COGS
  const decantOilMl = liquids.recipes?.decant3ml?.oilMl || 1;
  const decantAlcMl = liquids.recipes?.decant3ml?.alcoholMl || 2;
  const decantAlc = decantAlcMl * alcPerMl;
  const decantOil = decantOilMl * oilPerMl;
  const decantVial = bottles.decant3mlVial || 6;
  const decantCard = decantCardUnit;
  const baseNonOilDecant = decantAlc + decantVial + decantCard;
  const totalDecant3ml = Number((decantOil + baseNonOilDecant).toFixed(2));

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
        },
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
      baseNonOil100ml: Number(baseNonOil100.toFixed(2)),
      baseNonOil50ml: Number(baseNonOil50.toFixed(2)),
      baseNonOilDecant3ml: Number(baseNonOilDecant.toFixed(2)),
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
    Expense.find(query)
      .populate("assignedProduct", "name slug")
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
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
          totalBottlesGiven: {
            $sum: {
              $add: [
                { $ifNull: ["$promotionDetails.bottles100mlGiven", 0] },
                { $ifNull: ["$promotionDetails.bottles50mlGiven", 0] },
              ],
            },
          },
          total100mlGiven: { $sum: "$promotionDetails.bottles100mlGiven" },
          total50mlGiven: { $sum: "$promotionDetails.bottles50mlGiven" },
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
  const totalBottlesGiven = promoAgg[0]?.totalBottlesGiven || 0;
  const total100mlGiven = promoAgg[0]?.total100mlGiven || 0;
  const total50mlGiven = promoAgg[0]?.total50mlGiven || 0;

  res.status(200).json(
    successResponse({
      totals: {
        totalSpent,
        thisMonthSpent,
        lastMonthSpent,
        totalPromoSCS,
        totalDecantsGiven,
        totalBottlesGiven,
        total100mlGiven,
        total50mlGiven,
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
    assignedProduct = null,
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
      campaignName: promotionDetails?.campaignName || "",
      promoType: promotionDetails?.promoType || "MIXED",
      bottles100mlGiven: Number(promotionDetails?.bottles100mlGiven || 0),
      bottles50mlGiven: Number(promotionDetails?.bottles50mlGiven || 0),
      decantUnitsGiven: Number(promotionDetails?.decantUnitsGiven || 0),
      totalUnitsGiven: Number(promotionDetails?.totalUnitsGiven || parsedQty),
      decantUnitCostApplied: Number(promotionDetails?.decantUnitCostApplied || 0),
      recipient: promotionDetails?.recipient || "",
      fragranceAllocations: Array.isArray(promotionDetails?.fragranceAllocations)
        ? promotionDetails.fragranceAllocations.map((a) => ({
            product: a.product || null,
            productName: a.productName || "",
            format: a.format || "100ml",
            quantity: Number(a.quantity || 0),
            unitCost: Number(a.unitCost || 0),
            totalCost: Number(a.totalCost || (Number(a.quantity || 0) * Number(a.unitCost || 0)).toFixed(2)),
          }))
        : [],
      unassignedFormat: promotionDetails?.unassignedFormat || "100ml",
      unassignedQuantity: Number(promotionDetails?.unassignedQuantity || 0),
      unassignedUnitCost: Number(promotionDetails?.unassignedUnitCost || 0),
    },
    assignedProduct: assignedProduct || null,
    recordedBy: req.user?._id || null,
  });

  // Optional sync: update CostConfig benchmarks or specific product oil price
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
    } else if (category === "OILS" && assignedProduct) {
      // Fragrance oils have NO default; sync directly to the assigned fragrance product
      const oilKg = unit === "kg" ? computedUnitCost : computedUnitCost * 1000;
      const oilMl = unit === "grams" ? computedUnitCost : Number((computedUnitCost / 1000).toFixed(4));
      await Product.findByIdAndUpdate(assignedProduct, {
        oilCostPerKg: oilKg,
        oilCostPerMl: oilMl,
      });
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
 * Quick-action: log promotional giveaways (full 100ml/50ml boxed bottles or 3ml decants)
 * with optional multi-fragrance and multi-format allocation breakdown
 */
const logDecantGiveaway = asyncHandler(async (req, res) => {
  const {
    count = 1,
    format = "decant3ml", // '100ml', '50ml', 'decant3ml', 'mixed'
    campaignName = "Sample Giveaway",
    recipient = "",
    notes = "",
    fragranceId = null,
    fragranceAllocations = [],
    unassignedFormat = "decant3ml",
    unassignedQuantity = 0,
    unassignedUnitCost = 0,
  } = req.body;

  const parsedCount = Math.max(1, parseInt(count, 10));
  const config = await getOrCreateCostConfig();

  let totalAmount = 0;
  let unitCost = 0;
  let titleDetail = "";
  let baseFormatTitle =
    format === "100ml"
      ? "100ml Boxed Fragrance Giveaway"
      : format === "50ml"
      ? "50ml Boxed Fragrance Giveaway"
      : format === "mixed"
      ? "Promotional Fragrance & Decant Giveaway"
      : "3ml Decant Giveaway";

  const cleanedAllocations = [];

  if (Array.isArray(fragranceAllocations) && fragranceAllocations.length > 0) {
    let allocatedSum = 0;
    for (const alloc of fragranceAllocations) {
      const qty = Number(alloc.quantity) || 0;
      const uCost = Number(alloc.unitCost) || 0;
      const tCost = Number((qty * uCost).toFixed(2));
      const allocFormat = alloc.format || format || "100ml";
      allocatedSum += tCost;
      cleanedAllocations.push({
        product: alloc.product || null,
        productName: alloc.productName || "Fragrance",
        format: allocFormat,
        quantity: qty,
        unitCost: uCost,
        totalCost: tCost,
      });
    }

    const unassignedQty = Number(unassignedQuantity) || 0;
    const unassignedCost = Number(unassignedUnitCost) || 0;
    const unassignedTotal = Number((unassignedQty * unassignedCost).toFixed(2));

    totalAmount = Number((allocatedSum + unassignedTotal).toFixed(2));
    unitCost = parsedCount > 0 ? Number((totalAmount / parsedCount).toFixed(4)) : 0;
    const allocSummary = cleanedAllocations.map((a) => `${a.quantity}x ${a.productName} (${a.format})`).join(", ");
    titleDetail = ` (${allocSummary}${unassignedQty > 0 ? `, ${unassignedQty}x Unassigned` : ""})`;
  } else {
    let oilPerMl = 0;
    let fragranceName = "";
    if (fragranceId) {
      const prod = await Product.findById(fragranceId).select("name oilCostPerMl oilCostPerKg").lean();
      if (prod) {
        fragranceName = prod.name;
        oilPerMl = prod.oilCostPerMl > 0 ? prod.oilCostPerMl : prod.oilCostPerKg > 0 ? prod.oilCostPerKg / 1000 : 0;
      }
    }
    const { breakdowns } = computeStandardCogs(config, oilPerMl);
    if (format === "100ml") {
      unitCost = breakdowns.size100ml.totalCogs;
    } else if (format === "50ml") {
      unitCost = breakdowns.size50ml.totalCogs;
    } else {
      unitCost = breakdowns.decant3ml.totalCogs;
    }
    totalAmount = Number((parsedCount * unitCost).toFixed(2));
    titleDetail = fragranceName ? ` - ${fragranceName}` : "";
  }

  const bottles100ml =
    cleanedAllocations.filter((a) => a.format === "100ml").reduce((s, a) => s + a.quantity, 0) +
    (format === "100ml" && cleanedAllocations.length === 0 ? parsedCount : 0);
  const bottles50ml =
    cleanedAllocations.filter((a) => a.format === "50ml").reduce((s, a) => s + a.quantity, 0) +
    (format === "50ml" && cleanedAllocations.length === 0 ? parsedCount : 0);
  const decants =
    cleanedAllocations.filter((a) => a.format === "decant3ml").reduce((s, a) => s + a.quantity, 0) +
    (format === "decant3ml" && cleanedAllocations.length === 0 ? parsedCount : 0);

  const expense = await Expense.create({
    title: `${baseFormatTitle} (${parsedCount} units${titleDetail} - ${campaignName || "Promotion"})`,
    category: "MARKETING_GIVEAWAYS",
    amount: totalAmount,
    quantity: parsedCount,
    unit: "pcs",
    unitCost: unitCost,
    supplier: "SCNT In-House Production",
    date: new Date(),
    notes:
      notes ||
      `Promotional giveaway distribution: ${parsedCount} items (${cleanedAllocations.length > 0 ? "itemized breakdown" : format}).`,
    promotionDetails: {
      campaignName: campaignName || "Giveaway Campaign",
      promoType:
        format === "100ml"
          ? "BOTTLES_100ML"
          : format === "50ml"
          ? "BOTTLES_50ML"
          : format === "mixed"
          ? "MIXED"
          : "DECANTS",
      bottles100mlGiven: bottles100ml,
      bottles50mlGiven: bottles50ml,
      decantUnitsGiven: decants,
      totalUnitsGiven: parsedCount,
      decantUnitCostApplied: unitCost,
      recipient: recipient || "Marketing Distribution",
      fragranceAllocations: cleanedAllocations,
      unassignedFormat: unassignedFormat || format || "decant3ml",
      unassignedQuantity: Number(unassignedQuantity) || 0,
      unassignedUnitCost: Number(unassignedUnitCost) || 0,
    },
    assignedProduct: fragranceId || null,
    recordedBy: req.user?._id || null,
  });

  await recordAuditAction(req, {
    action: "GIVEAWAY_LOG",
    targetType: "Expense",
    targetId: expense._id.toString(),
    details: { count: parsedCount, totalAmount, unitCost, format, allocationsCount: cleanedAllocations.length },
  });

  res.status(201).json(
    successResponse(
      {
        expense,
        unitCost,
        totalLogged: totalAmount,
      },
      `Logged promotional giveaway of ${parsedCount} units (${totalAmount} EGP) into marketing expenses.`
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
  // Base non-oil packaging & solvent benchmarks
  const { breakdowns: baseBreakdowns, unitCostsSummary } = computeStandardCogs(config, 0);
  const products = await Product.find({})
    .select("name slug price size sizes stock oilCostPerKg oilCostPerMl SCNTcollection")
    .lean();

  const productAnalysis = products.map((p) => {
    // Fragrance oils have NO global default; each fragrance specifies its own oil cost
    const hasOilPrice = Boolean(
      (p.oilCostPerMl && p.oilCostPerMl > 0) || (p.oilCostPerKg && p.oilCostPerKg > 0)
    );
    const prodOilPerMl = p.oilCostPerMl > 0 ? p.oilCostPerMl : p.oilCostPerKg > 0 ? p.oilCostPerKg / 1000 : 0;
    const prodOilPerKg = p.oilCostPerKg > 0 ? p.oilCostPerKg : prodOilPerMl > 0 ? prodOilPerMl * 1000 : 0;

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
      oilCostPerKg: prodOilPerKg,
      oilCostPerMl: prodOilPerMl,
      hasCustomOilPrice: hasOilPrice,
      isOilConfigured: hasOilPrice,
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
      benchmarks: baseBreakdowns,
      unitCostsSummary,
      productAnalysis,
      decant3mlAnalysis: {
        baseCogsWithoutOil: baseBreakdowns.decant3ml.totalCogs,
        breakdown: baseBreakdowns.decant3ml,
        suggestedSellingPrice: 120, // benchmark reference
        suggestedGrossProfit: Number((120 - baseBreakdowns.decant3ml.totalCogs).toFixed(2)),
        suggestedMarginPercent: Number((((120 - baseBreakdowns.decant3ml.totalCogs) / 120) * 100).toFixed(1)),
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
