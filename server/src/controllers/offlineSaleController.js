const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const ApiError = require("../utils/ApiError");
const OfflineSale = require("../models/OfflineSale");
const Product = require("../models/Product");
const { deleteCache, invalidatePattern } = require("../utils/cache");
const { recordAuditAction } = require("../utils/auditLogger");
const {
  getOrCreateCostConfig,
  buildProductCogsMap,
  calculateOfflineSalesMarginAndSales,
  calculateSingleOfflineSaleMarginAndCogs,
} = require("../utils/cogsCalculator");

/**
 * Generate a clean, unique human-readable receipt number
 * e.g. OFF-261023-4819
 */
function generateReceiptNumber() {
  const d = new Date();
  const year = String(d.getFullYear()).slice(-2);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `OFF-${year}${month}${day}-${randomSuffix}`;
}

/**
 * List offline sales with pagination, search, and date filters
 */
const listOfflineSales = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
  const skip = (page - 1) * limit;

  const query = {};

  if (req.query.channel) {
    query.channel = req.query.channel;
  }

  if (req.query.paymentMethod) {
    query.paymentMethod = req.query.paymentMethod;
  }

  if (req.query.paymentStatus) {
    query.paymentStatus = req.query.paymentStatus;
  }

  if (req.query.startDate || req.query.endDate) {
    query.saleDate = {};
    if (req.query.startDate) {
      query.saleDate.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      const end = new Date(req.query.endDate);
      end.setHours(23, 59, 59, 999);
      query.saleDate.$lte = end;
    }
  }

  if (req.query.search) {
    const searchRegex = new RegExp(String(req.query.search).trim(), "i");
    query.$or = [
      { receiptNumber: searchRegex },
      { "customer.fullName": searchRegex },
      { "customer.phone": searchRegex },
      { location: searchRegex },
      { notes: searchRegex },
      { "items.productName": searchRegex },
    ];
  }

  const [total, sales, products, costConfig] = await Promise.all([
    OfflineSale.countDocuments(query),
    OfflineSale.find(query)
      .populate("items.product", "name slug price sizes images coverImage clearBackground_Image")
      .populate("recordedBy", "full_name email")
      .sort({ saleDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.find().lean(),
    getOrCreateCostConfig(),
  ]);

  const { productMap, defaultSizeCogs } = buildProductCogsMap(products, costConfig);

  const enrichedSales = sales.map((s) => {
    const metrics = calculateSingleOfflineSaleMarginAndCogs(s, productMap, defaultSizeCogs);
    return {
      ...s,
      cogs: metrics.cogs,
      netRevenue: metrics.netRevenue,
      marginPercent: metrics.marginPercent,
      items: metrics.items,
    };
  });

  res.status(200).json(
    successResponse({
      sales: enrichedSales,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
        limit,
      },
    })
  );
});

/**
 * Summary KPI statistics for offline sales
 */
const getOfflineSalesSummary = asyncHandler(async (_req, res) => {
  const [totalsAgg, paymentAgg, channelAgg, totalRevenueAgg, totalOrders, offlineSales, products, costConfig] =
    await Promise.all([
      // Units sold aggregate
      OfflineSale.aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: null,
            totalUnitsSold: { $sum: "$items.quantity" },
          },
        },
      ]),
      // Payment method breakdown
      OfflineSale.aggregate([
        {
          $group: {
            _id: "$paymentMethod",
            count: { $sum: 1 },
            total: { $sum: "$total" },
          },
        },
        { $sort: { total: -1 } },
      ]),
      // Channel breakdown
      OfflineSale.aggregate([
        {
          $group: {
            _id: "$channel",
            count: { $sum: 1 },
            total: { $sum: "$total" },
          },
        },
        { $sort: { total: -1 } },
      ]),
      // Gross sales volume aggregate
      OfflineSale.aggregate([
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$total" },
          },
        },
      ]),
      OfflineSale.countDocuments({}),
      OfflineSale.find({}).select("items total subtotal discount channel").lean(),
      Product.find({}).select("name slug price sizes oilCostPerKg oilCostPerMl").lean(),
      getOrCreateCostConfig(),
    ]);

  const { productMap, defaultSizeCogs } = buildProductCogsMap(products, costConfig);
  const marginMetrics = calculateOfflineSalesMarginAndSales(offlineSales, productMap, defaultSizeCogs);

  const totalSales = totalRevenueAgg[0]?.totalSales || 0;
  const totalRevenue = marginMetrics.margin; // Actual net margin from offline fragrances sold
  const totalUnitsSold = totalsAgg[0]?.totalUnitsSold || marginMetrics.totalUnits || 0;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
  const marginPercent = totalSales > 0 ? Number(((totalRevenue / totalSales) * 100).toFixed(1)) : 0;

  res.status(200).json(
    successResponse({
      totalRevenue, // Actual net margin
      totalSales, // Gross sales volume
      marginPercent,
      totalOrders,
      totalUnitsSold,
      avgOrderValue,
      paymentMethods: paymentAgg.map((p) => ({ method: p._id, count: p.count, total: p.total })),
      channels: channelAgg.map((c) => ({ channel: c._id, count: c.count, total: c.total })),
      topProducts: marginMetrics.topProducts,
    })
  );
});

/**
 * Record a new offline purchase / sale
 */
const createOfflineSale = asyncHandler(async (req, res) => {
  const {
    items,
    discount = 0,
    paymentMethod = "CASH",
    paymentStatus = "PAID",
    channel = "WALK_IN",
    location = "",
    customer = {},
    notes = "",
    saleDate = new Date(),
    deductStock = true,
  } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "At least one product item is required for offline sale");
  }

  // Fetch products and validate
  const productIds = items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  let subtotal = 0;
  const processedItems = [];

  for (const item of items) {
    if (!item.product) {
      throw new ApiError(400, "Item must specify a product ID");
    }
    const product = productMap.get(String(item.product));
    if (!product) {
      throw new ApiError(404, `Product not found: ${item.product}`);
    }

    const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
    const unitPrice = Number(item.unitPrice);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new ApiError(400, `Invalid sold unit price for ${product.name}`);
    }

    const lineSubtotal = Math.round(unitPrice * quantity * 100) / 100;
    subtotal += lineSubtotal;

    processedItems.push({
      product: product._id,
      productName: item.productName || product.name,
      size: item.size || product.size || "100ml",
      quantity,
      unitPrice,
      subtotal: lineSubtotal,
    });
  }

  const numDiscount = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal - numDiscount);

  // Generate unique receipt number
  let receiptNumber = generateReceiptNumber();
  let existing = await OfflineSale.findOne({ receiptNumber });
  while (existing) {
    receiptNumber = generateReceiptNumber();
    existing = await OfflineSale.findOne({ receiptNumber });
  }

  // Deduct stock if requested
  if (deductStock) {
    for (const item of processedItems) {
      const product = productMap.get(item.product.toString());
      if (product) {
        const newStock = Math.max(0, (product.stock || 0) - item.quantity);
        const updateQuery = { stock: newStock };

        if (Array.isArray(product.sizes) && product.sizes.length > 0) {
          updateQuery.sizes = product.sizes.map((s) => {
            if (s.size === item.size) {
              const currentSizeStock = Number(s.stock) || 0;
              return {
                size: s.size,
                price: s.price,
                stock: Math.max(0, currentSizeStock - item.quantity),
              };
            }
            return s;
          });
        }

        await Product.findByIdAndUpdate(product._id, updateQuery);
      }
    }
  }

  const offlineSale = await OfflineSale.create({
    receiptNumber,
    items: processedItems,
    subtotal,
    discount: numDiscount,
    total,
    paymentMethod,
    paymentStatus,
    channel,
    location: location.trim(),
    customer: {
      fullName: (customer.fullName || "Walk-in Customer").trim(),
      phone: (customer.phone || "").trim(),
      email: (customer.email || "").trim(),
    },
    notes: (notes || "").trim(),
    saleDate: saleDate ? new Date(saleDate) : new Date(),
    deductedStock: Boolean(deductStock),
    recordedBy: req.user?.userId || null,
  });

  // Clear dashboard and order caches
  await deleteCache("admin:dashboard:summary");
  await invalidatePattern("admin:dashboard:*");

  await recordAuditAction(req, {
    action: "OFFLINE_SALE_CREATE",
    targetType: "OfflineSale",
    targetId: offlineSale._id.toString(),
    details: {
      receiptNumber,
      total,
      paymentMethod,
      channel,
      itemCount: processedItems.length,
      deductedStock: offlineSale.deductedStock,
    },
  });

  res.status(201).json(successResponse(offlineSale, "Offline purchase recorded successfully"));
});

/**
 * Get offline sale by ID
 */
const getOfflineSaleById = asyncHandler(async (req, res) => {
  const sale = await OfflineSale.findById(req.params.id)
    .populate("items.product", "name slug price sizes images coverImage clearBackground_Image")
    .populate("recordedBy", "full_name email")
    .lean();

  if (!sale) {
    throw new ApiError(404, "Offline sale not found");
  }

  res.status(200).json(successResponse(sale));
});

/**
 * Update offline purchase details, items, pricing, customer, payment, and channel
 */
const updateOfflineSale = asyncHandler(async (req, res) => {
  const existingSale = await OfflineSale.findById(req.params.id);
  if (!existingSale) {
    throw new ApiError(404, "Offline sale not found");
  }

  const {
    items,
    discount,
    paymentStatus,
    paymentMethod,
    channel,
    location,
    customer,
    notes,
    saleDate,
    adjustStock,
  } = req.body;

  const updateData = {};

  if (notes !== undefined) updateData.notes = String(notes).trim();
  if (paymentStatus) updateData.paymentStatus = paymentStatus;
  if (paymentMethod) updateData.paymentMethod = paymentMethod;
  if (channel) updateData.channel = channel;
  if (location !== undefined) updateData.location = String(location).trim();
  if (saleDate) updateData.saleDate = new Date(saleDate);

  if (customer && typeof customer === "object") {
    updateData.customer = {
      fullName: (customer.fullName || "Walk-in Customer").trim(),
      phone: (customer.phone || "").trim(),
      email: (customer.email || "").trim(),
    };
  }

  // Handle items update, pricing recalculation, and stock adjustments
  if (Array.isArray(items) && items.length > 0) {
    const productIds = items.map((i) => i.product).filter(Boolean);
    const dbProducts = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(dbProducts.map((p) => [p._id.toString(), p]));

    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      if (!item.product) {
        throw new ApiError(400, "Item must specify a product ID");
      }
      const product = productMap.get(String(item.product));
      if (!product) {
        throw new ApiError(404, `Product not found: ${item.product}`);
      }

      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      const unitPrice = Number(item.unitPrice);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new ApiError(400, `Invalid sold unit price for ${product.name}`);
      }

      const lineSubtotal = Math.round(unitPrice * quantity * 100) / 100;
      subtotal += lineSubtotal;

      processedItems.push({
        product: product._id,
        productName: item.productName || product.name,
        size: item.size || product.size || "100ml",
        quantity,
        unitPrice,
        subtotal: lineSubtotal,
      });
    }

    const numDiscount =
      discount !== undefined ? Math.max(0, Number(discount) || 0) : existingSale.discount || 0;
    const total = Math.max(0, subtotal - numDiscount);

    // If stock adjustment is requested or the sale previously deducted stock
    const shouldSyncStock = adjustStock === true || (adjustStock !== false && existingSale.deductedStock);
    if (shouldSyncStock) {
      // 1. Restore previous stock from existing items
      for (const oldItem of existingSale.items) {
        const product = await Product.findById(oldItem.product);
        if (product) {
          const updateQuery = { $inc: { stock: oldItem.quantity } };
          if (Array.isArray(product.sizes) && product.sizes.length > 0) {
            updateQuery.sizes = product.sizes.map((s) => {
              if (s.size === oldItem.size) {
                return {
                  size: s.size,
                  price: s.price,
                  stock: (Number(s.stock) || 0) + oldItem.quantity,
                };
              }
              return s;
            });
          }
          await Product.findByIdAndUpdate(product._id, updateQuery);
        }
      }

      // 2. Deduct new stock for updated items
      for (const newItem of processedItems) {
        const product = await Product.findById(newItem.product);
        if (product) {
          const newStock = Math.max(0, (product.stock || 0) - newItem.quantity);
          const updateQuery = { stock: newStock };
          if (Array.isArray(product.sizes) && product.sizes.length > 0) {
            updateQuery.sizes = product.sizes.map((s) => {
              if (s.size === newItem.size) {
                const currentSizeStock = Number(s.stock) || 0;
                return {
                  size: s.size,
                  price: s.price,
                  stock: Math.max(0, currentSizeStock - newItem.quantity),
                };
              }
              return s;
            });
          }
          await Product.findByIdAndUpdate(product._id, updateQuery);
        }
      }
      updateData.deductedStock = true;
    }

    updateData.items = processedItems;
    updateData.subtotal = subtotal;
    updateData.discount = numDiscount;
    updateData.total = total;
  } else if (discount !== undefined) {
    const numDiscount = Math.max(0, Number(discount) || 0);
    updateData.discount = numDiscount;
    updateData.total = Math.max(0, (existingSale.subtotal || 0) - numDiscount);
  }

  const updatedSale = await OfflineSale.findByIdAndUpdate(req.params.id, updateData, { new: true })
    .populate("items.product", "name slug price sizes images coverImage clearBackground_Image")
    .lean();

  // Clear dashboard and order caches
  await deleteCache("admin:dashboard:summary");
  await invalidatePattern("admin:dashboard:*");

  await recordAuditAction(req, {
    action: "OFFLINE_SALE_UPDATE",
    targetType: "OfflineSale",
    targetId: req.params.id,
    details: updateData,
  });

  res.status(200).json(successResponse(updatedSale, "Offline sale updated successfully"));
});

/**
 * Delete/Void an offline purchase with optional inventory stock restoration
 */
const deleteOfflineSale = asyncHandler(async (req, res) => {
  const sale = await OfflineSale.findById(req.params.id);
  if (!sale) {
    throw new ApiError(404, "Offline sale not found");
  }

  const shouldRestoreStock =
    req.query.restoreStock === "true" ||
    req.query.restoreStock === true ||
    req.body?.restoreStock === true;

  if (shouldRestoreStock && sale.deductedStock) {
    for (const item of sale.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const updateQuery = { $inc: { stock: item.quantity } };
        if (Array.isArray(product.sizes) && product.sizes.length > 0) {
          updateQuery.sizes = product.sizes.map((s) => {
            if (s.size === item.size) {
              return {
                size: s.size,
                price: s.price,
                stock: (Number(s.stock) || 0) + item.quantity,
              };
            }
            return s;
          });
        }
        await Product.findByIdAndUpdate(product._id, updateQuery);
      }
    }
  }

  await OfflineSale.findByIdAndDelete(req.params.id);

  await deleteCache("admin:dashboard:summary");
  await invalidatePattern("admin:dashboard:*");

  await recordAuditAction(req, {
    action: "OFFLINE_SALE_DELETE",
    targetType: "OfflineSale",
    targetId: req.params.id,
    details: {
      receiptNumber: sale.receiptNumber,
      total: sale.total,
      restoredStock: shouldRestoreStock && sale.deductedStock,
    },
  });

  res.status(200).json(
    successResponse(
      { deletedId: req.params.id, restoredStock: shouldRestoreStock && sale.deductedStock },
      "Offline sale deleted successfully"
    )
  );
});

module.exports = {
  listOfflineSales,
  getOfflineSalesSummary,
  createOfflineSale,
  getOfflineSaleById,
  updateOfflineSale,
  deleteOfflineSale,
};
