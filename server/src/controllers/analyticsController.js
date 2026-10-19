const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const ApiError = require("../utils/ApiError");
const Visit = require("../models/Visit");
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

module.exports = {
  trackVisit,
  getAnalyticsOverview,
  getAnalyticsTrend,
  getTopPages,
  getTopReferrers,
  getDeviceBreakdown,
  getRealtimeVisits,
};
