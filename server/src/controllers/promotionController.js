const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { successResponse } = require("../utils/apiResponse");
const { getCache, setCache, deleteCache } = require("../utils/cache");
const { recordAuditAction } = require("../utils/auditLogger");
const PromoCode = require("../models/PromoCode");
const PromotionCampaign = require("../models/PromotionCampaign");
const PromotionLead = require("../models/PromotionLead");
const { sendPromotionDiscountEmail } = require("../services/emailService");

const ACTIVE_PROMO_CACHE_KEY = "promotions:active";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Synchronize promotion campaign settings with underlying PromoCode model so
 * users can seamlessly redeem the code in checkout & cart.
 */
async function syncUnderlyingPromoCode(campaign) {
  if (!campaign || !campaign.promoCode) return;
  const code = String(campaign.promoCode).trim().toUpperCase();

  await PromoCode.findOneAndUpdate(
    { code },
    {
      $set: {
        code,
        discountType: campaign.discountType || "PERCENTAGE",
        discountValue: Number(campaign.discountValue) || 10,
        minSubtotal: Number(campaign.minSubtotal) || 0,
        startsAt: campaign.startsAt || null,
        expiresAt: campaign.expiresAt || null,
        isActive: Boolean(campaign.isActive),
        discountScope: "WHOLE_CART",
      },
    },
    { upsert: true, new: true }
  );

  // Invalidate promo codes cache
  await deleteCache("admin:promoCodes:all");
}

/**
 * Public: Get current active promotion campaign for visitor modal.
 * Prioritizes active SPECIAL_EVENT within [startsAt, expiresAt].
 * Falls back to active DEFAULT_WELCOME if no special event is currently running.
 * Omits raw promoCode to prevent unauthenticated coupon scraping.
 */
const getActivePromotion = asyncHandler(async (_req, res) => {
  const cached = await getCache(ACTIVE_PROMO_CACHE_KEY);
  if (cached !== null && cached !== undefined) {
    return res.status(200).json(successResponse(cached));
  }

  const now = new Date();

  // 1. Check for active Special Event (e.g. Black Friday)
  let campaign = await PromotionCampaign.findOne({
    type: "SPECIAL_EVENT",
    isActive: true,
    showModal: true,
    startsAt: { $lte: now },
    expiresAt: { $gte: now },
  }).sort({ startsAt: -1, createdAt: -1 });

  // 2. Fall back to active Default Welcome campaign (Evergreen / Normal times)
  if (!campaign) {
    campaign = await PromotionCampaign.findOne({
      type: "DEFAULT_WELCOME",
      isActive: true,
      showModal: true,
    }).sort({ createdAt: -1 });
  }

  if (!campaign) {
    await setCache(ACTIVE_PROMO_CACHE_KEY, null, 60);
    return res.status(200).json(successResponse(null, "No active promotion"));
  }

  // Safe sanitized payload: omits raw promoCode
  const payload = {
    _id: campaign._id,
    name: campaign.name,
    type: campaign.type,
    badge: campaign.badge,
    title: campaign.title,
    subtitle: campaign.subtitle,
    description: campaign.description,
    discountHighlight: campaign.discountHighlight,
    ctaText: campaign.ctaText,
    theme: campaign.theme,
    minSubtotal: campaign.minSubtotal,
    startsAt: campaign.startsAt,
    expiresAt: campaign.expiresAt,
  };

  // Cache for 60 seconds
  await setCache(ACTIVE_PROMO_CACHE_KEY, payload, 60);
  res.status(200).json(successResponse(payload));
});

/**
 * Public: Claim promotion code by entering email in modal.
 * Dispatches email containing the code and returns the code for instant 1-click copy.
 */
const claimPromotion = asyncHandler(async (req, res) => {
  const campaignId = req.body?.campaignId;
  const rawEmail = String(req.body?.email || "").trim().toLowerCase();
  const locale = req.body?.locale === "ar" ? "ar" : "en";
  const visitorId = String(req.headers["x-visitor-id"] || req.body?.visitorId || "").trim();

  if (!campaignId) {
    throw new ApiError(400, "Campaign ID is required.");
  }

  if (!rawEmail || !EMAIL_REGEX.test(rawEmail)) {
    throw new ApiError(400, "Please provide a valid email address.");
  }

  const campaign = await PromotionCampaign.findById(campaignId);
  if (!campaign || !campaign.isActive) {
    throw new ApiError(404, "This promotion is no longer available.");
  }

  // If special event, verify time window
  if (campaign.type === "SPECIAL_EVENT") {
    const now = Date.now();
    if (campaign.startsAt && new Date(campaign.startsAt).getTime() > now) {
      throw new ApiError(400, "This promotion has not started yet.");
    }
    if (campaign.expiresAt && new Date(campaign.expiresAt).getTime() < now) {
      throw new ApiError(400, "This promotion has expired.");
    }
  }

  // Capture lead or update existing claim
  const clientIp = req.ip || req.headers["x-forwarded-for"] || "";
  const userAgent = req.headers["user-agent"] || "";

  await PromotionLead.findOneAndUpdate(
    { campaign: campaign._id, email: rawEmail },
    {
      $set: {
        promoCode: campaign.promoCode,
        visitorId,
        ip: clientIp,
        userAgent,
        locale,
        claimedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  // Send branded email containing the discount code
  await sendPromotionDiscountEmail({
    to: rawEmail,
    campaign,
    promoCode: campaign.promoCode,
    locale,
  }).catch((err) => {
    // Log mail failure without blocking response
    console.error("Promotion email send failure:", err?.message || err);
  });

  res.status(200).json(
    successResponse(
      {
        promoCode: campaign.promoCode,
        discountHighlight: campaign.discountHighlight,
        discountType: campaign.discountType,
        discountValue: campaign.discountValue,
      },
      locale === "ar"
        ? "تم إرسال كود الخصم إلى بريدك الإلكتروني بنجاح!"
        : "Discount code sent to your email successfully!"
    )
  );
});

/**
 * Admin: List all promotional campaigns with claimed leads count.
 */
const adminListCampaigns = asyncHandler(async (_req, res) => {
  const campaigns = await PromotionCampaign.find({}).sort({ createdAt: -1 }).lean();

  // Aggregate lead counts
  const leadCounts = await PromotionLead.aggregate([
    { $group: { _id: "$campaign", count: { $sum: 1 } } },
  ]);

  const leadCountMap = new Map(leadCounts.map((l) => [l._id.toString(), l.count]));

  const enriched = campaigns.map((c) => ({
    ...c,
    leadsCount: leadCountMap.get(c._id.toString()) || 0,
  }));

  res.status(200).json(successResponse(enriched));
});

/**
 * Admin: Create a new promotional campaign.
 */
const adminCreateCampaign = asyncHandler(async (req, res) => {
  const {
    name,
    type,
    badge,
    title,
    subtitle,
    description,
    discountHighlight,
    ctaText,
    promoCode,
    discountType,
    discountValue,
    minSubtotal,
    startsAt,
    expiresAt,
    isActive,
    showModal,
    theme,
    emailSubject,
    emailHeadline,
  } = req.body || {};

  if (!name || !String(name).trim()) {
    throw new ApiError(400, "Campaign name is required.");
  }
  if (!promoCode || !String(promoCode).trim()) {
    throw new ApiError(400, "Promo code is required.");
  }
  if (!title?.en && !title?.ar) {
    throw new ApiError(400, "Title is required in at least one language.");
  }

  const campaign = await PromotionCampaign.create({
    name: String(name).trim(),
    type: type === "DEFAULT_WELCOME" ? "DEFAULT_WELCOME" : "SPECIAL_EVENT",
    badge: badge || { en: "Special Offer", ar: "عرض خاص" },
    title: title || { en: "", ar: "" },
    subtitle: subtitle || { en: "", ar: "" },
    description: description || { en: "", ar: "" },
    discountHighlight: discountHighlight || { en: "15% OFF", ar: "خصم 15%" },
    ctaText: ctaText || { en: "Claim Discount", ar: "احصل على الخصم" },
    promoCode: String(promoCode).trim().toUpperCase(),
    discountType: discountType === "FIXED" ? "FIXED" : "PERCENTAGE",
    discountValue: Number(discountValue) || 10,
    minSubtotal: Number(minSubtotal) || 0,
    startsAt: startsAt ? new Date(startsAt) : null,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    isActive: isActive !== undefined ? Boolean(isActive) : true,
    showModal: showModal !== undefined ? Boolean(showModal) : true,
    theme: theme || "black_friday",
    emailSubject: emailSubject || { en: "", ar: "" },
    emailHeadline: emailHeadline || { en: "", ar: "" },
  });

  // Keep PromoCode collection in sync
  await syncUnderlyingPromoCode(campaign);
  await deleteCache(ACTIVE_PROMO_CACHE_KEY);

  await recordAuditAction(req, {
    action: "PROMOTION_CAMPAIGN_CREATE",
    targetType: "PromotionCampaign",
    targetId: campaign._id.toString(),
    details: { name: campaign.name, promoCode: campaign.promoCode },
  });

  res.status(201).json(successResponse(campaign, "Promotion campaign created successfully."));
});

/**
 * Admin: Update an existing promotional campaign.
 */
const adminUpdateCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  if (updateData.promoCode) {
    updateData.promoCode = String(updateData.promoCode).trim().toUpperCase();
  }
  if (updateData.startsAt) {
    updateData.startsAt = new Date(updateData.startsAt);
  }
  if (updateData.expiresAt) {
    updateData.expiresAt = new Date(updateData.expiresAt);
  }

  const campaign = await PromotionCampaign.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!campaign) {
    throw new ApiError(404, "Promotion campaign not found.");
  }

  // Keep PromoCode collection in sync
  await syncUnderlyingPromoCode(campaign);
  await deleteCache(ACTIVE_PROMO_CACHE_KEY);

  await recordAuditAction(req, {
    action: "PROMOTION_CAMPAIGN_UPDATE",
    targetType: "PromotionCampaign",
    targetId: campaign._id.toString(),
    details: { name: campaign.name, promoCode: campaign.promoCode },
  });

  res.status(200).json(successResponse(campaign, "Promotion campaign updated successfully."));
});

/**
 * Admin: Delete a promotional campaign.
 */
const adminDeleteCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await PromotionCampaign.findByIdAndDelete(id);

  if (!deleted) {
    throw new ApiError(404, "Promotion campaign not found.");
  }

  await deleteCache(ACTIVE_PROMO_CACHE_KEY);

  await recordAuditAction(req, {
    action: "PROMOTION_CAMPAIGN_DELETE",
    targetType: "PromotionCampaign",
    targetId: id,
    details: { name: deleted.name },
  });

  res.status(200).json(successResponse(null, "Promotion campaign deleted successfully."));
});

/**
 * Admin: Retrieve claimed leads for a specific campaign.
 */
const adminGetCampaignLeads = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const campaign = await PromotionCampaign.findById(id).select("name promoCode");
  if (!campaign) {
    throw new ApiError(404, "Promotion campaign not found.");
  }

  const leads = await PromotionLead.find({ campaign: id })
    .sort({ claimedAt: -1 })
    .lean();

  res.status(200).json(
    successResponse({
      campaign,
      leads,
      totalCount: leads.length,
    })
  );
});

module.exports = {
  getActivePromotion,
  claimPromotion,
  adminListCampaigns,
  adminCreateCampaign,
  adminUpdateCampaign,
  adminDeleteCampaign,
  adminGetCampaignLeads,
};
