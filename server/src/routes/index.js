const express = require("express");
const authRoutes = require("./authRoutes");
const productRoutes = require("./productRoutes");
const collectionRoutes = require("./collectionRoutes");
const cartRoutes = require("./cartRoutes");
const wishlistRoutes = require("./wishlistRoutes");
const orderRoutes = require("./orderRoutes");
const adminRoutes = require("./adminRoutes");
const analyticsRoutes = require("./analyticsRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/collections", collectionRoutes);
router.use("/cart", cartRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/orders", orderRoutes);
router.use("/admin", adminRoutes);
router.use("/analytics", analyticsRoutes);

module.exports = router;

