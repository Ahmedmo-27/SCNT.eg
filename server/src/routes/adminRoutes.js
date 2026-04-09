const express = require("express");
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);
router.get("/dashboard", adminController.getDashboardSummary);
router.get("/users", adminController.listUsers);
router.patch("/users/:id/role", adminController.updateUserRole);
router.delete("/users/:id", adminController.deleteUser);
router.get("/orders", adminController.getAllOrders);
router.put("/orders/:id/status", adminController.updateOrderStatus);
router.get("/collections", adminController.listCollections);
router.post("/collections", adminController.createCollection);
router.put("/collections/:id", adminController.updateCollection);
router.delete("/collections/:id", adminController.deleteCollection);
router.get("/promo-codes", adminController.listPromoCodes);
router.post("/promo-codes", adminController.createPromoCode);
router.put("/promo-codes/:id", adminController.updatePromoCode);
router.delete("/promo-codes/:id", adminController.deletePromoCode);

module.exports = router;
