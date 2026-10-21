const express = require("express");
const cartController = require("../controllers/cartController");
const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware");

const router = express.Router();

router.use(optionalAuthMiddleware);
router.get("/", cartController.getCart);
router.post("/clear", cartController.clearCart);
router.post("/add", cartController.addToCart);
router.post("/remove", cartController.removeFromCart);
router.post("/update", cartController.updateCartItem);
router.post("/replace", cartController.replaceCart);
router.post("/promo/apply", cartController.applyPromoCode);
router.post("/promo/remove", cartController.removePromoCode);
router.post("/contact", cartController.updateCartContact);
router.post("/restore/:cartId", cartController.restoreCart);
router.get("/restore/:cartId", cartController.restoreCart);

module.exports = router;
