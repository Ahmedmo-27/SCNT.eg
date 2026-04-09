const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const orderService = require("../services/orderService");
const ApiError = require("../utils/ApiError");
const PromoCode = require("../models/PromoCode");
const User = require("../models/User");
const Product = require("../models/Product");
const Collection = require("../models/Collection");
const Order = require("../models/Order");
const userRepository = require("../repositories/userRepository");
const { sendPromotionalEmail } = require("../services/emailService");

const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getAllOrders();
  res.status(200).json(successResponse(orders));
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.params.id, req.body.status);
  res.status(200).json(successResponse(order, "Order status updated"));
});

const listPromoCodes = asyncHandler(async (_req, res) => {
  const promos = await PromoCode.find({}).sort({ createdAt: -1 });
  res.status(200).json(successResponse(promos));
});

const createPromoCode = asyncHandler(async (req, res) => {
  const promo = await PromoCode.create({
    code: req.body?.code,
    discountType: req.body?.discountType,
    discountValue: req.body?.discountValue,
    minSubtotal: req.body?.minSubtotal,
    maxDiscount: req.body?.maxDiscount,
    isActive: req.body?.isActive,
    startsAt: req.body?.startsAt,
    expiresAt: req.body?.expiresAt,
  });
  res.status(201).json(successResponse(promo, "Promo code created"));
});

const updatePromoCode = asyncHandler(async (req, res) => {
  const promo = await PromoCode.findByIdAndUpdate(
    req.params.id,
    {
      code: req.body?.code,
      discountType: req.body?.discountType,
      discountValue: req.body?.discountValue,
      minSubtotal: req.body?.minSubtotal,
      maxDiscount: req.body?.maxDiscount,
      isActive: req.body?.isActive,
      startsAt: req.body?.startsAt,
      expiresAt: req.body?.expiresAt,
    },
    { new: true, runValidators: true }
  );
  if (!promo) throw new ApiError(404, "Promo code not found");
  res.status(200).json(successResponse(promo, "Promo code updated"));
});

const deletePromoCode = asyncHandler(async (req, res) => {
  const deleted = await PromoCode.findByIdAndDelete(req.params.id);
  if (!deleted) throw new ApiError(404, "Promo code not found");
  res.status(200).json(successResponse(null, "Promo code deleted"));
});

const getDashboardSummary = asyncHandler(async (_req, res) => {
  const [usersCount, productsCount, ordersCount, collectionsCount, pendingOrders, revenueAgg] = await Promise.all([
    User.countDocuments({}),
    Product.countDocuments({}),
    Order.countDocuments({}),
    Collection.countDocuments({}),
    Order.countDocuments({ status: "PENDING" }),
    Order.aggregate([{ $group: { _id: null, totalRevenue: { $sum: "$total" } } }]),
  ]);

  res.status(200).json(
    successResponse({
      usersCount,
      productsCount,
      ordersCount,
      collectionsCount,
      pendingOrders,
      totalRevenue: revenueAgg[0]?.totalRevenue || 0,
    })
  );
});

const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find({})
    .select("-password -emailVerificationToken")
    .sort({ createdAt: -1 });
  res.status(200).json(successResponse(users));
});

const updateUserRole = asyncHandler(async (req, res) => {
  const role = String(req.body?.role || "").trim();
  if (!["user", "admin"].includes(role)) {
    throw new ApiError(400, "Role must be either user or admin");
  }

  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select(
    "-password -emailVerificationToken"
  );
  if (!user) throw new ApiError(404, "User not found");
  res.status(200).json(successResponse(user, "User role updated"));
});

const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.userId) {
    throw new ApiError(400, "You cannot delete your own account");
  }
  const deleted = await User.findByIdAndDelete(req.params.id);
  if (!deleted) throw new ApiError(404, "User not found");
  res.status(200).json(successResponse(null, "User deleted"));
});

const listCollections = asyncHandler(async (_req, res) => {
  const collections = await Collection.find({}).sort({ createdAt: -1 });
  res.status(200).json(successResponse(collections));
});

const createCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.create({
    name: req.body?.name,
    slug: req.body?.slug,
    themeColor: req.body?.themeColor,
    tagline: req.body?.tagline,
    sub_tagline: req.body?.sub_tagline,
    description: req.body?.description,
  });
  res.status(201).json(successResponse(collection, "Collection created"));
});

const updateCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body?.name,
      slug: req.body?.slug,
      themeColor: req.body?.themeColor,
      tagline: req.body?.tagline,
      sub_tagline: req.body?.sub_tagline,
      description: req.body?.description,
    },
    { new: true, runValidators: true }
  );
  if (!collection) throw new ApiError(404, "Collection not found");
  res.status(200).json(successResponse(collection, "Collection updated"));
});

const deleteCollection = asyncHandler(async (req, res) => {
  const productsUsingCollection = await Product.countDocuments({ collection: req.params.id });
  if (productsUsingCollection > 0) {
    throw new ApiError(400, "Collection has products and cannot be deleted");
  }

  const deleted = await Collection.findByIdAndDelete(req.params.id);
  if (!deleted) throw new ApiError(404, "Collection not found");
  res.status(200).json(successResponse(null, "Collection deleted"));
});

const sendPromotionalBroadcast = asyncHandler(async (req, res) => {
  const subject = String(req.body?.subject || "").trim();
  const preheader = String(req.body?.preheader || "").trim();
  const contentHtml = String(req.body?.contentHtml || "").trim();
  const onlyVerified = Boolean(req.body?.onlyVerified);
  const startedAt = Date.now();

  if (!subject || !contentHtml) {
    throw new ApiError(400, "subject and contentHtml are required");
  }

  const users = await userRepository.findUsersForPromotion({ onlyVerified });
  const baseAudienceCount = users.length;
  const validEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const seenEmails = new Set();
  let missingEmailCount = 0;
  let invalidEmailCount = 0;
  let duplicateEmailCount = 0;
  const recipients = [];

  for (const user of users) {
    const normalizedEmail = String(user.email || "")
      .trim()
      .toLowerCase();
    if (!normalizedEmail) {
      missingEmailCount += 1;
      continue;
    }
    if (!validEmailRegex.test(normalizedEmail)) {
      invalidEmailCount += 1;
      continue;
    }
    if (seenEmails.has(normalizedEmail)) {
      duplicateEmailCount += 1;
      continue;
    }
    seenEmails.add(normalizedEmail);
    recipients.push(normalizedEmail);
  }

  let sentCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  const failureSamples = [];
  const skippedReasons = {};

  await Promise.all(
    recipients.map(async (email) => {
      try {
        const result = await sendPromotionalEmail({
          to: email,
          subject,
          preheader,
          contentHtml,
        });
        if (result?.sent) {
          sentCount += 1;
          return;
        }
        skippedCount += 1;
        const reason = result?.reason || "unknown";
        skippedReasons[reason] = (skippedReasons[reason] || 0) + 1;
      } catch (error) {
        failedCount += 1;
        if (failureSamples.length < 5) {
          failureSamples.push({
            email,
            reason: error?.message || "Unexpected mailer error",
          });
        }
      }
    })
  );

  const attemptedCount = recipients.length;
  const processedCount = sentCount + failedCount + skippedCount;
  const processingMs = Date.now() - startedAt;

  res.status(200).json(
    successResponse(
      {
        totalUsers: baseAudienceCount,
        targetedRecipients: attemptedCount,
        attemptedCount,
        processedCount,
        sentCount,
        failedCount,
        skippedCount,
        omittedCount: missingEmailCount + invalidEmailCount + duplicateEmailCount,
        omittedBreakdown: {
          missingEmailCount,
          invalidEmailCount,
          duplicateEmailCount,
        },
        skippedBreakdown: skippedReasons,
        failureSamples,
        onlyVerified,
        processingMs,
      },
      "Promotional campaign processed"
    )
  );
});

module.exports = {
  getAllOrders,
  updateOrderStatus,
  getDashboardSummary,
  listUsers,
  updateUserRole,
  deleteUser,
  listCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  listPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  sendPromotionalBroadcast,
};
