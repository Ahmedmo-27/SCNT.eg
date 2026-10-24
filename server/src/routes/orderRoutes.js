const express = require("express");
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");
const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware");

const router = express.Router();

router.post("/", authMiddleware, orderController.createOrder);
router.get("/my-orders", authMiddleware, orderController.getMyOrders);
router.post("/:id/cancel", authMiddleware, orderController.cancelOrder);
router.get("/:id", optionalAuthMiddleware, orderController.getOrderById);

module.exports = router;
