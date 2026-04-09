const express = require("express");
const cartController = require("../controllers/cartController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.get("/", cartController.getCart);
router.post("/clear", cartController.clearCart);
router.post("/add", cartController.addToCart);
router.post("/remove", cartController.removeFromCart);
router.post("/update", cartController.updateCartItem);
router.post("/replace", cartController.replaceCart);
router.post("/promo/apply", cartController.applyPromoCode);
router.post("/promo/remove", cartController.removePromoCode);

module.exports = router;
