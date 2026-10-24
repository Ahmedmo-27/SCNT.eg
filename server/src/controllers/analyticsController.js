const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const ApiError = require("../utils/ApiError");
const Visit = require("../models/Visit");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const PromoCode = require("../models/PromoCode");
const User = require("../models/User");
const cartRepository = require("../repositories/cartRepository");
const { getClientIp } = require("../middleware/requestLogger");
const {
  parseUserAgent,
  normalizeReferrerDomain,
} = require("../utils/userAgentParser");

/**
 * Helper to build common date & admin filters
 */
function buildFilter(query = {}) {
  const filter = {};
  const excludeAdmin = query.excludeAdmin !== "false";
  const excludeBots = query.excludeBots !== "false";

  if (excludeAdmin) {
    filter.isAdmin = { $ne: true };
  }
  if (excludeBots) {
    filter.isBot = { $ne: true };
  }

  const range = query.range || "7d";
  const now = new Date();
  let startDate = new Date();

  if (range === "today" || range === "24h") {
    startDate.setHours(0, 0, 0, 0);
  } else if (range === "30d") {
    startDate.setDate(now.getDate() - 30);
  } else if (range === "90d") {
    startDate.setDate(now.getDate() - 90);
  } else {
    // Default 7d
    startDate.setDate(now.getDate() - 7);
  }

  filter.createdAt = { $gte: startDate };
  return { filter, startDate, range, now };
}

/**
 * Ingest visit from frontend
 */
const trackVisit = asyncHandler(async (req, res) => {
  const visitorId = String(req.body?.visitorId || "").trim();
  const sessionId = String(req.body?.sessionId || "").trim();
  const path = String(req.body?.path || "/").trim();

  if (!visitorId || !sessionId) {
    throw new ApiError(400, "visitorId and sessionId are required");
  }

  const userAgent = req.headers["user-agent"] || "";
  const ip = getClientIp(req);
  const { device, browser, os, isBot } = parseUserAgent(userAgent);
  const referrer = String(req.body?.referrer || "").trim();
  const referrerDomain = normalizeReferrerDomain(referrer);

  const isAdmin = req.user?.role === "admin";
  const userId = req.user?.userId || null;
  const title = String(req.body?.title || "").slice(0, 200);
  const screenResolution = req.body?.screenResolution ? String(req.body.screenResolution).slice(0, 20) : null;
  const locale = String(req.body?.locale || "en").slice(0, 10);

  // Automatically determine stage if not explicitly provided
  let stage = String(req.body?.stage || "").trim();
  if (!stage) {
    if (path.startsWith("/order-confirmation") || path.startsWith("/checkout/success")) {
      stage = "order_placed";
    } else if (path.startsWith("/checkout")) {
      stage = "checkout_start";
    } else if (path.startsWith("/cart")) {
      stage = "cart_view";
    } else if (path.startsWith("/product/")) {
      stage = "product_view";
    } else {
      stage = "browse";
    }
  }

  const action = String(req.body?.action || "pageview").trim();
  const metadata = req.body?.metadata && typeof req.body.metadata === "object" ? req.body.metadata : {};

  // Non-blocking write
  await Visit.create({
    visitorId,
    sessionId,
    path,
    title,
    referrer,
    referrerDomain,
    ip,
    userAgent,
    device,
    browser,
    os,
    screenResolution,
    locale,
    userId,
    isAdmin,
    isBot,
    stage,
    action,
    metadata,
  });

  res.status(200).json(successResponse({ tracked: true }));
});

/**
 * Admin: Get overview KPI metrics
 */
const getAnalyticsOverview = asyncHandler(async (req, res) => {
  const { filter, startDate, now } = buildFilter(req.query);

  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const baseFilter = {
    isAdmin: filter.isAdmin,
    isBot: filter.isBot,
  };

  // Run aggregations in parallel
  const [
    periodStats,
    todayStats,
    yesterdayStats,
    activeVisitors,
    sessionCount,
  ] = await Promise.all([
    // Current period total pageviews & unique visitors
    Visit.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalPageviews: { $sum: 1 },
          uniqueVisitors: { $addToSet: "$visitorId" },
        },
      },
    ]),

    // Today stats
    Visit.aggregate([
      { $match: { ...baseFilter, createdAt: { $gte: todayStart } } },
      {
        $group: {
          _id: null,
          pageviews: { $sum: 1 },
          uniqueVisitors: { $addToSet: "$visitorId" },
        },
      },
    ]),

    // Yesterday stats
    Visit.aggregate([
      {
        $match: {
          ...baseFilter,
          createdAt: { $gte: yesterdayStart, $lt: todayStart },
        },
      },
      {
        $group: {
          _id: null,
          pageviews: { $sum: 1 },
          uniqueVisitors: { $addToSet: "$visitorId" },
        },
      },
    ]),

    // Active now (in last 15 mins)
    Visit.distinct("visitorId", {
      ...baseFilter,
      createdAt: { $gte: fifteenMinutesAgo },
    }),

    // Unique sessions in period
    Visit.distinct("sessionId", filter),
  ]);

  const totalPageviews = periodStats[0]?.totalPageviews || 0;
  const uniqueVisitors = periodStats[0]?.uniqueVisitors?.length || 0;
  const todayPageviews = todayStats[0]?.pageviews || 0;
  const todayUniqueVisitors = todayStats[0]?.uniqueVisitors?.length || 0;
  const yesterdayPageviews = yesterdayStats[0]?.pageviews || 0;
  const yesterdayUniqueVisitors = yesterdayStats[0]?.uniqueVisitors?.length || 0;
  const activeNow = activeVisitors.length || 0;
  const sessions = sessionCount.length || 1;
  const avgPagesPerSession = sessions > 0 ? Number((totalPageviews / sessions).toFixed(2)) : 1;

  // Day-over-day growth rate
  const pageviewsGrowth = yesterdayPageviews > 0
    ? Number((((todayPageviews - yesterdayPageviews) / yesterdayPageviews) * 100).toFixed(1))
    : todayPageviews > 0 ? 100 : 0;

  const visitorsGrowth = yesterdayUniqueVisitors > 0
    ? Number((((todayUniqueVisitors - yesterdayUniqueVisitors) / yesterdayUniqueVisitors) * 100).toFixed(1))
    : todayUniqueVisitors > 0 ? 100 : 0;

  res.status(200).json(
    successResponse({
      totalPageviews,
      uniqueVisitors,
      todayPageviews,
      todayUniqueVisitors,
      yesterdayPageviews,
      yesterdayUniqueVisitors,
      activeNow,
      avgPagesPerSession,
      growth: {
        pageviewsGrowth,
        visitorsGrowth,
      },
      range: req.query.range || "7d",
    })
  );
});

/**
 * Admin: Get time series trend data for chart
 */
const getAnalyticsTrend = asyncHandler(async (req, res) => {
  const { filter, range } = buildFilter(req.query);

  const isHourly = range === "today" || range === "24h";

  const groupFormat = isHourly
    ? {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" },
        hour: { $hour: "$createdAt" },
      }
    : {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" },
      };

  const trendData = await Visit.aggregate([
    { $match: filter },
    {
      $group: {
        _id: groupFormat,
        pageviews: { $sum: 1 },
        visitorsSet: { $addToSet: "$visitorId" },
      },
    },
    {
      $project: {
        _id: 1,
        pageviews: 1,
        uniqueVisitors: { $size: "$visitorsSet" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 } },
  ]);

  // Format into clean timeline array
  const formatted = trendData.map((item) => {
    const { year, month, day, hour } = item._id;
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const label = isHourly
      ? `${dateStr} ${String(hour).padStart(2, "0")}:00`
      : dateStr;

    return {
      date: label,
      pageviews: item.pageviews,
      uniqueVisitors: item.uniqueVisitors,
    };
  });

  res.status(200).json(successResponse(formatted));
});

/**
 * Admin: Top visited pages
 */
const getTopPages = asyncHandler(async (req, res) => {
  const { filter } = buildFilter(req.query);

  const pages = await Visit.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$path",
        title: { $last: "$title" },
        pageviews: { $sum: 1 },
        visitorsSet: { $addToSet: "$visitorId" },
        lastVisited: { $max: "$createdAt" },
      },
    },
    {
      $project: {
        path: "$_id",
        title: 1,
        pageviews: 1,
        uniqueVisitors: { $size: "$visitorsSet" },
        lastVisited: 1,
      },
    },
    { $sort: { pageviews: -1 } },
    { $limit: 25 },
  ]);

  res.status(200).json(successResponse(pages));
});

/**
 * Admin: Top Referrers & Traffic Sources
 */
const getTopReferrers = asyncHandler(async (req, res) => {
  const { filter } = buildFilter(req.query);

  const referrers = await Visit.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$referrerDomain",
        visits: { $sum: 1 },
        visitorsSet: { $addToSet: "$visitorId" },
      },
    },
    {
      $project: {
        domain: "$_id",
        visits: 1,
        uniqueVisitors: { $size: "$visitorsSet" },
      },
    },
    { $sort: { visits: -1 } },
    { $limit: 15 },
  ]);

  res.status(200).json(successResponse(referrers));
});

/**
 * Admin: Device, Browser, and OS breakdown
 */
const getDeviceBreakdown = asyncHandler(async (req, res) => {
  const { filter } = buildFilter(req.query);

  const [devices, browsers, osList] = await Promise.all([
    Visit.aggregate([
      { $match: filter },
      { $group: { _id: "$device", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Visit.aggregate([
      { $match: filter },
      { $group: { _id: "$browser", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    Visit.aggregate([
      { $match: filter },
      { $group: { _id: "$os", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
  ]);

  res.status(200).json(
    successResponse({
      devices: devices.map((d) => ({ name: d._id || "unknown", count: d.count })),
      browsers: browsers.map((b) => ({ name: b._id || "unknown", count: b.count })),
      os: osList.map((o) => ({ name: o._id || "unknown", count: o.count })),
    })
  );
});

/**
 * Admin: Real-time latest visits stream with pagination
 */
const getRealtimeVisits = asyncHandler(async (req, res) => {
  const excludeAdmin = req.query.excludeAdmin !== "false";
  const filter = {};
  if (excludeAdmin) filter.isAdmin = { $ne: true };

  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Visit.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "full_name email")
      .lean(),
    Visit.countDocuments(filter),
  ]);

  res.status(200).json(
    successResponse({
      items,
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
 * Admin: Get e-commerce buying funnel conversion metrics
 */
const getFunnelMetrics = asyncHandler(async (req, res) => {
  const { filter, startDate } = buildFilter(req.query);

  const [
    allVisitors,
    productVisitors,
    cartVisitors,
    checkoutVisitors,
    purchasedVisitors,
    completedOrders,
  ] = await Promise.all([
    // Stage 1: All visitors
    Visit.distinct("visitorId", filter),

    // Stage 2: Viewed a product
    Visit.distinct("visitorId", {
      ...filter,
      $or: [
        { stage: { $in: ["product_view", "cart_view", "checkout_start", "order_placed"] } },
        { path: { $regex: "^/product/" } },
      ],
    }),

    // Stage 3: Cart active or viewed
    Visit.distinct("visitorId", {
      ...filter,
      $or: [
        { stage: { $in: ["cart_view", "checkout_start", "order_placed"] } },
        { action: "add_to_cart" },
        { path: { $regex: "^/cart" } },
      ],
    }),

    // Stage 4: Checkout started
    Visit.distinct("visitorId", {
      ...filter,
      $or: [
        { stage: { $in: ["checkout_start", "order_placed"] } },
        { path: { $regex: "^/checkout" } },
      ],
    }),

    // Stage 5: Purchased / Converted
    Visit.distinct("visitorId", {
      ...filter,
      $or: [{ stage: "order_placed" }, { action: "order_placed" }],
    }),

    // Order aggregates for verified revenue
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$total" },
        },
      },
    ]),
  ]);

  const step1 = allVisitors.length || 0;
  const step2 = Math.min(step1, productVisitors.length || 0);
  const step3 = Math.min(step2 || step1, cartVisitors.length || 0);
  const step4 = Math.min(step3 || step2 || step1, checkoutVisitors.length || 0);
  const orderCount = completedOrders[0]?.totalOrders || 0;
  const step5 = Math.max(purchasedVisitors.length || 0, orderCount);
  const totalRevenue = completedOrders[0]?.totalRevenue || 0;

  const pct = (part, total) => (total > 0 ? Number(((part / total) * 100).toFixed(1)) : 0);

  const stages = [
    {
      id: "browse",
      name: "Store Browsers",
      count: step1,
      percentageOfTotal: 100,
      dropOffCount: Math.max(0, step1 - step2),
      dropOffRate: pct(Math.max(0, step1 - step2), step1),
    },
    {
      id: "product_view",
      name: "Product Viewers",
      count: step2,
      percentageOfTotal: pct(step2, step1),
      dropOffCount: Math.max(0, step2 - step3),
      dropOffRate: pct(Math.max(0, step2 - step3), step2),
    },
    {
      id: "cart_view",
      name: "Cart Engaged",
      count: step3,
      percentageOfTotal: pct(step3, step1),
      dropOffCount: Math.max(0, step3 - step4),
      dropOffRate: pct(Math.max(0, step3 - step4), step3),
    },
    {
      id: "checkout_start",
      name: "Checkout Started",
      count: step4,
      percentageOfTotal: pct(step4, step1),
      dropOffCount: Math.max(0, step4 - step5),
      dropOffRate: pct(Math.max(0, step4 - step5), step4),
    },
    {
      id: "order_placed",
      name: "Orders Placed",
      count: step5,
      percentageOfTotal: pct(step5, step1),
      dropOffCount: 0,
      dropOffRate: 0,
    },
  ];

  res.status(200).json(
    successResponse({
      stages,
      conversionRate: pct(step5, step1),
      totalVisitors: step1,
      totalOrders: step5,
      totalRevenue,
      range: req.query.range || "7d",
    })
  );
});

/**
 * Admin: Get customer sessions and buying phase progress
 */
const getCustomerJourneys = asyncHandler(async (req, res) => {
  const { filter } = buildFilter(req.query);

  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const stageFilter = String(req.query.stage || "all").trim();
  const typeFilter = String(req.query.type || "all").trim();
  const search = String(req.query.search || "").trim().toLowerCase();

  // Aggregate sessions within filter period
  const rawSessions = await Visit.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$sessionId",
        visitorId: { $last: "$visitorId" },
        userId: { $last: "$userId" },
        ip: { $last: "$ip" },
        device: { $last: "$device" },
        browser: { $last: "$browser" },
        os: { $last: "$os" },
        startedAt: { $min: "$createdAt" },
        lastActiveAt: { $max: "$createdAt" },
        eventCount: { $sum: 1 },
        stages: { $addToSet: "$stage" },
        actions: { $addToSet: "$action" },
        paths: { $push: "$path" },
        metadataList: { $push: "$metadata" },
      },
    },
    { $sort: { lastActiveAt: -1 } },
  ]);

  // Extract user IDs and visitor IDs for cart enrichment
  const userIds = rawSessions.map((s) => s.userId).filter(Boolean);
  const visitorIds = rawSessions.map((s) => s.visitorId).filter(Boolean);

  const [users, carts] = await Promise.all([
    userIds.length > 0
      ? User.find({ _id: { $in: userIds } }).select("full_name email phone address").lean()
      : [],
    Cart.find({
      $or: [
        { user: { $in: userIds } },
        { visitorId: { $in: visitorIds }, user: null },
      ],
      "items.0": { $exists: true },
    }).lean(),
  ]);

  const userMap = new Map(users.map((u) => [u._id.toString(), u]));
  const userCartMap = new Map();
  const visitorCartMap = new Map();

  for (const c of carts) {
    if (c.user) userCartMap.set(c.user.toString(), c);
    if (c.visitorId) visitorCartMap.set(c.visitorId, c);
  }

  // Format and classify sessions
  const mappedSessions = rawSessions.map((session) => {
    const stages = session.stages || [];
    const actions = session.actions || [];
    const paths = session.paths || [];

    let highestStage = "browse";
    let outcomeStatus = "browsing";

    if (stages.includes("order_placed") || actions.includes("order_placed")) {
      highestStage = "order_placed";
      outcomeStatus = "converted";
    } else if (
      stages.includes("checkout_start") ||
      paths.some((p) => p && p.startsWith("/checkout"))
    ) {
      highestStage = "checkout_start";
      outcomeStatus = "abandoned_checkout";
    } else if (
      stages.includes("cart_view") ||
      actions.includes("add_to_cart") ||
      paths.some((p) => p && p.startsWith("/cart"))
    ) {
      highestStage = "cart_view";
      outcomeStatus = "abandoned_cart";
    } else if (
      stages.includes("product_view") ||
      paths.some((p) => p && p.startsWith("/product/"))
    ) {
      highestStage = "product_view";
      outcomeStatus = "product_interest";
    }

    const userObj = session.userId ? userMap.get(session.userId.toString()) : null;
    const isGuest = !userObj;

    // Check cart
    const activeCart = userObj
      ? userCartMap.get(session.userId.toString())
      : visitorCartMap.get(session.visitorId);

    const cartItemCount = activeCart?.items?.reduce((sum, i) => sum + (i.quantity || 1), 0) || 0;
    const promoCode = activeCart?.promoCode || "";

    const startedTime = new Date(session.startedAt).getTime();
    const lastActiveTime = new Date(session.lastActiveAt).getTime();
    const durationSeconds = Math.max(0, Math.floor((lastActiveTime - startedTime) / 1000));

    return {
      sessionId: session._id,
      visitorId: session.visitorId,
      isGuest,
      user: userObj
        ? {
            _id: userObj._id,
            fullName: userObj.full_name || "Customer",
            email: userObj.email || "",
            phone: userObj.phone || userObj.address?.phone || "",
            city: userObj.address?.city || userObj.address?.addressLine2 || "",
          }
        : null,
      device: session.device || "desktop",
      browser: session.browser || "Unknown",
      os: session.os || "Unknown",
      ip: session.ip || "",
      highestStage,
      outcomeStatus,
      cart: {
        hasItems: cartItemCount > 0,
        itemCount: cartItemCount,
        promoCode,
      },
      startedAt: session.startedAt,
      lastActiveAt: session.lastActiveAt,
      durationSeconds,
      eventCount: session.eventCount || 1,
    };
  });

  // Apply optional stage, type, and search filters
  let filtered = mappedSessions;

  if (stageFilter && stageFilter !== "all") {
    filtered = filtered.filter(
      (s) => s.outcomeStatus === stageFilter || s.highestStage === stageFilter
    );
  }

  if (typeFilter === "registered") {
    filtered = filtered.filter((s) => !s.isGuest);
  } else if (typeFilter === "guest") {
    filtered = filtered.filter((s) => s.isGuest);
  }

  if (search) {
    filtered = filtered.filter((s) => {
      const name = (s.user?.fullName || "").toLowerCase();
      const email = (s.user?.email || "").toLowerCase();
      const phone = (s.user?.phone || "").toLowerCase();
      const vid = (s.visitorId || "").toLowerCase();
      const sid = (s.sessionId || "").toLowerCase();
      return (
        name.includes(search) ||
        email.includes(search) ||
        phone.includes(search) ||
        vid.includes(search) ||
        sid.includes(search)
      );
    });
  }

  const total = filtered.length;
  const skip = (page - 1) * limit;
  const pagedItems = filtered.slice(skip, skip + limit);

  res.status(200).json(
    successResponse({
      items: pagedItems,
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
 * Admin: Get detailed chronological event breadcrumbs for a session
 */
const getSessionJourneyTimeline = asyncHandler(async (req, res) => {
  const sessionId = String(req.params.sessionId || "").trim();
  if (!sessionId) throw new ApiError(400, "Session ID is required");

  const visits = await Visit.find({ sessionId })
    .sort({ createdAt: 1 })
    .populate("userId", "full_name email")
    .lean();

  if (!visits.length) {
    throw new ApiError(404, "No journey recorded for this session");
  }

  const timeline = visits.map((v) => {
    let actionLabel = "Viewed Page";
    if (v.action === "add_to_cart") actionLabel = "Added to Cart";
    else if (v.action === "remove_from_cart") actionLabel = "Removed from Cart";
    else if (v.action === "apply_coupon") actionLabel = "Applied Promo Code";
    else if (v.action === "checkout_start") actionLabel = "Started Checkout";
    else if (v.action === "order_placed" || v.stage === "order_placed") actionLabel = "Order Placed";
    else if (v.stage === "product_view") actionLabel = "Viewed Product";
    else if (v.stage === "cart_view") actionLabel = "Viewed Cart";

    return {
      _id: v._id,
      timestamp: v.createdAt,
      stage: v.stage,
      action: v.action,
      actionLabel,
      path: v.path,
      title: v.title || v.path,
      metadata: v.metadata || {},
    };
  });

  const first = visits[0];
  const last = visits[visits.length - 1];

  res.status(200).json(
    successResponse({
      sessionId,
      visitorId: first.visitorId,
      user: first.userId,
      device: first.device,
      browser: first.browser,
      os: first.os,
      ip: first.ip,
      startedAt: first.createdAt,
      lastActiveAt: last.createdAt,
      totalEvents: visits.length,
      timeline,
    })
  );
});

/**
 * Admin: Get all currently active and abandoned carts holding products
 */
const getActiveCarts = asyncHandler(async (req, res) => {
  const status = req.query.status || "all";
  const type = req.query.type || "all";
  const search = req.query.search || "";
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 25)));

  const result = await cartRepository.findAllCartsWithItems({
    status,
    type,
    search,
    page,
    limit,
  });

  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;

  // Enrich cart items with calculations and guest metadata
  const formattedCarts = await Promise.all(
    result.carts.map(async (cart) => {
      const isGuest = !cart.user;
      let visitorMeta = null;

      if (isGuest && cart.visitorId) {
        const lastVisit = await Visit.findOne({ visitorId: cart.visitorId })
          .sort({ createdAt: -1 })
          .select("device browser os ip referrerDomain createdAt")
          .lean();
        visitorMeta = lastVisit;
      }

      let subtotal = 0;
      const lines = (cart.items || []).map((item) => {
        const product = item.product || {};
        const price = Number(product.price || 0);
        const quantity = Number(item.quantity || 1);
        const lineTotal = price * quantity;
        subtotal += lineTotal;

        return {
          productId: product._id,
          name: product.name || "Unknown Fragrance",
          slug: product.slug,
          size: item.size || "100ml",
          unitPrice: price,
          quantity,
          lineTotal,
          image: Array.isArray(product.images) && product.images[0] ? product.images[0] : "",
          stock: product.stock ?? 0,
        };
      });

      const lastActiveTime = new Date(cart.lastActiveAt || cart.updatedAt).getTime();
      const isAbandoned = lastActiveTime < twoHoursAgo;

      return {
        _id: cart._id,
        isGuest,
        user: cart.user
          ? {
              _id: cart.user._id,
              fullName: cart.user.full_name || "Customer",
              email: cart.user.email || "",
              phone: cart.user.phone || cart.user.address?.phone || "",
              city: cart.user.address?.city || "",
              isRegistered: true,
            }
          : cart.contact && (cart.contact.fullName || cart.contact.phone || cart.contact.email)
          ? {
              _id: null,
              fullName: cart.contact.fullName || "Guest Customer",
              email: cart.contact.email || "",
              phone: cart.contact.phone || "",
              city: cart.contact.city || cart.contact.governorate || "",
              isRegistered: false,
              isCapturedLead: true,
            }
          : null,
        contact: cart.contact || null,
        recoverySentAt: cart.recoverySentAt || null,
        recoveryCount: cart.recoveryCount || 0,
        visitorId: cart.visitorId,
        visitorMeta: visitorMeta
          ? {
              device: visitorMeta.device,
              browser: visitorMeta.browser,
              os: visitorMeta.os,
              ip: visitorMeta.ip,
              referrerDomain: visitorMeta.referrerDomain,
            }
          : null,
        items: lines,
        itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
        subtotal,
        promoCode: cart.promoCode || "",
        lastActiveAt: cart.lastActiveAt || cart.updatedAt,
        isAbandoned,
      };
    })
  );

  res.status(200).json(
    successResponse({
      carts: formattedCarts,
      pagination: {
        total: result.total,
        page: result.page,
        pages: result.pages,
        limit: result.limit,
      },
    })
  );
});

/**
 * Admin: Get comprehensive coupon performance and list of users who used them
 */
const getCouponAnalytics = asyncHandler(async (_req, res) => {
  const [promos, orders, activeCarts] = await Promise.all([
    PromoCode.find({})
      .populate("applicableProducts.product", "name price")
      .sort({ createdAt: -1 })
      .lean(),
    Order.find({ promoCode: { $ne: "" } })
      .populate("user", "full_name email phone")
      .sort({ createdAt: -1 })
      .lean(),
    Cart.find({ promoCode: { $ne: "" }, "items.0": { $exists: true } })
      .populate("user", "full_name email phone")
      .lean(),
  ]);

  // Group orders by promo code
  const ordersByCode = new Map();
  for (const o of orders) {
    const code = String(o.promoCode || "").trim().toUpperCase();
    if (!code) continue;
    if (!ordersByCode.has(code)) ordersByCode.set(code, []);
    ordersByCode.get(code).push(o);
  }

  // Group active carts by promo code
  const cartsByCode = new Map();
  for (const c of activeCarts) {
    const code = String(c.promoCode || "").trim().toUpperCase();
    if (!code) continue;
    if (!cartsByCode.has(code)) cartsByCode.set(code, []);
    cartsByCode.get(code).push(c);
  }

  // Build coupon analytics list
  const knownCodes = new Set(promos.map((p) => String(p.code).trim().toUpperCase()));

  const couponStats = promos.map((promo) => {
    const code = String(promo.code).trim().toUpperCase();
    const promoOrders = ordersByCode.get(code) || [];
    const promoCarts = cartsByCode.get(code) || [];

    const totalRedemptions = promoOrders.length;
    const totalRevenueDriven = promoOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const totalDiscountGiven = promoOrders.reduce((sum, o) => sum + Number(o.discount || 0), 0);

    const redemptions = promoOrders.map((o) => ({
      orderId: o._id,
      orderRef: `#${String(o._id).slice(-8).toUpperCase()}`,
      orderDate: o.createdAt,
      orderTotal: o.total,
      discountAmount: o.discount,
      orderStatus: o.status,
      customer: {
        _id: o.user?._id,
        fullName: o.user?.full_name || o.address?.fullName || "Customer",
        email: o.user?.email || "",
        phone: o.user?.phone || o.address?.phone || "",
      },
    }));

    const activeCartHolders = promoCarts.map((c) => ({
      cartId: c._id,
      isGuest: !c.user,
      customerName: c.user?.full_name || "Guest Visitor",
      customerEmail: c.user?.email || "",
      visitorId: c.visitorId,
      itemCount: c.items?.reduce((sum, i) => sum + (i.quantity || 1), 0) || 0,
      lastActiveAt: c.lastActiveAt || c.updatedAt,
    }));

    return {
      _id: promo._id,
      code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minSubtotal: promo.minSubtotal || 0,
      maxDiscount: promo.maxDiscount,
      isActive: promo.isActive,
      startsAt: promo.startsAt,
      expiresAt: promo.expiresAt,
      applicableProducts: promo.applicableProducts || [],
      totalRedemptions,
      totalRevenueDriven,
      totalDiscountGiven,
      activeCartsCount: promoCarts.length,
      redemptions,
      activeCartHolders,
    };
  });

  // Also include any ad-hoc codes from orders not in PromoCode collection
  for (const [code, promoOrders] of ordersByCode.entries()) {
    if (!knownCodes.has(code)) {
      const promoCarts = cartsByCode.get(code) || [];
      const totalRedemptions = promoOrders.length;
      const totalRevenueDriven = promoOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      const totalDiscountGiven = promoOrders.reduce((sum, o) => sum + Number(o.discount || 0), 0);

      couponStats.push({
        _id: `custom_${code}`,
        code,
        discountType: "CUSTOM",
        discountValue: 0,
        minSubtotal: 0,
        maxDiscount: null,
        isActive: false,
        startsAt: null,
        expiresAt: null,
        totalRedemptions,
        totalRevenueDriven,
        totalDiscountGiven,
        activeCartsCount: promoCarts.length,
        redemptions: promoOrders.map((o) => ({
          orderId: o._id,
          orderRef: `#${String(o._id).slice(-8).toUpperCase()}`,
          orderDate: o.createdAt,
          orderTotal: o.total,
          discountAmount: o.discount,
          orderStatus: o.status,
          customer: {
            _id: o.user?._id,
            fullName: o.user?.full_name || o.address?.fullName || "Customer",
            email: o.user?.email || "",
            phone: o.user?.phone || o.address?.phone || "",
          },
        })),
        activeCartHolders: promoCarts.map((c) => ({
          cartId: c._id,
          isGuest: !c.user,
          customerName: c.user?.full_name || "Guest Visitor",
          customerEmail: c.user?.email || "",
          visitorId: c.visitorId,
          itemCount: c.items?.reduce((sum, i) => sum + (i.quantity || 1), 0) || 0,
          lastActiveAt: c.lastActiveAt || c.updatedAt,
        })),
      });
    }
  }

  const grandTotals = {
    totalCoupons: couponStats.length,
    totalRedemptions: couponStats.reduce((sum, c) => sum + c.totalRedemptions, 0),
    totalRevenueDriven: couponStats.reduce((sum, c) => sum + c.totalRevenueDriven, 0),
    totalDiscountGiven: couponStats.reduce((sum, c) => sum + c.totalDiscountGiven, 0),
    totalActiveCartHolders: couponStats.reduce((sum, c) => sum + c.activeCartsCount, 0),
  };

  res.status(200).json(
    successResponse({
      summary: grandTotals,
      coupons: couponStats,
    })
  );
});

module.exports = {
  trackVisit,
  getAnalyticsOverview,
  getAnalyticsTrend,
  getTopPages,
  getTopReferrers,
  getDeviceBreakdown,
  getRealtimeVisits,
  getFunnelMetrics,
  getCustomerJourneys,
  getSessionJourneyTimeline,
  getActiveCarts,
  getCouponAnalytics,
};
