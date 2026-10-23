const express = require("express");
const adminController = require("../controllers/adminController");
const analyticsController = require("../controllers/analyticsController");
const adminLogController = require("../controllers/adminLogController");
const cartController = require("../controllers/cartController");
const expenseController = require("../controllers/expenseController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

// Core Dashboard
router.get("/dashboard", adminController.getDashboardSummary);

// Expenses, Materials & COGS Management
router.get("/expenses", expenseController.listExpenses);
router.get("/expenses/summary", expenseController.getExpenseSummary);
router.post("/expenses", expenseController.createExpense);
router.post("/expenses/log-decant-giveaway", expenseController.logDecantGiveaway);
router.put("/expenses/:id", expenseController.updateExpense);
router.delete("/expenses/:id", expenseController.deleteExpense);

router.get("/cost-config", expenseController.getCostConfig);
router.put("/cost-config", expenseController.updateCostConfig);
router.get("/cogs-analysis", expenseController.getCogsAnalysis);
router.put("/expenses/products/:id/oil-price", expenseController.updateProductOilPrice);

// Platform Analytics & Visit Tracking
router.get("/analytics/overview", analyticsController.getAnalyticsOverview);
router.get("/analytics/trend", analyticsController.getAnalyticsTrend);
router.get("/analytics/top-pages", analyticsController.getTopPages);
router.get("/analytics/referrers", analyticsController.getTopReferrers);
router.get("/analytics/devices", analyticsController.getDeviceBreakdown);
router.get("/analytics/realtime", analyticsController.getRealtimeVisits);
router.get("/analytics/funnel", analyticsController.getFunnelMetrics);
router.get("/analytics/journeys", analyticsController.getCustomerJourneys);
router.get("/analytics/journeys/:sessionId", analyticsController.getSessionJourneyTimeline);
router.get("/analytics/carts", analyticsController.getActiveCarts);
router.post("/analytics/carts/:cartId/recovery-email", cartController.sendCartRecoveryEmail);
router.get("/analytics/coupons", analyticsController.getCouponAnalytics);

// System Logs & Audit
router.get("/logs", adminLogController.listLogs);
router.get("/logs/stats", adminLogController.getLogStats);
router.get("/logs/export", adminLogController.exportLogs);
router.delete("/logs/clear", adminLogController.clearLogs);

// Users Management
router.get("/users", adminController.listUsers);
router.patch("/users/:id/role", adminController.updateUserRole);
router.delete("/users/:id", adminController.deleteUser);

// Orders Management
router.get("/orders", adminController.getAllOrders);
router.put("/orders/:id/status", adminController.updateOrderStatus);

// Collections Management
router.get("/collections", adminController.listCollections);
router.post("/collections", adminController.createCollection);
router.put("/collections/:id", adminController.updateCollection);
router.delete("/collections/:id", adminController.deleteCollection);

// Promo Codes Management
router.get("/promo-codes", adminController.listPromoCodes);
router.post("/promo-codes", adminController.createPromoCode);
router.put("/promo-codes/:id", adminController.updatePromoCode);
router.delete("/promo-codes/:id", adminController.deletePromoCode);

// Marketing / Mailing
router.post("/mail/promotional", adminController.sendPromotionalBroadcast);

module.exports = router;

