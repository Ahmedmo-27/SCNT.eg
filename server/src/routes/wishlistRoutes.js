const express = require("express");
const wishlistController = require("../controllers/wishlistController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.get("/", wishlistController.getWishlist);
router.post("/clear", wishlistController.clearWishlist);
router.post("/add", wishlistController.addToWishlist);
router.post("/remove", wishlistController.removeFromWishlist);

module.exports = router;
