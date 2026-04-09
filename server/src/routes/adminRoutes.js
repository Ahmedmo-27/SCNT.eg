const express = require("express");
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);
router.get("/orders", adminController.getAllOrders);
router.put("/orders/:id/status", adminController.updateOrderStatus);
router.get("/promo-codes", adminController.listPromoCodes);
router.post("/promo-codes", adminController.createPromoCode);

module.exports = router;
