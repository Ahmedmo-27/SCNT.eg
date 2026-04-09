const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const wishlistService = require("../services/wishlistService");

const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.getWishlist(req.user.userId);
  res.status(200).json(successResponse(wishlist));
});

const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const wishlist = await wishlistService.addItem(req.user.userId, productId);
  res.status(200).json(successResponse(wishlist, "Item added to wishlist"));
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const wishlist = await wishlistService.removeItem(req.user.userId, productId);
  res.status(200).json(successResponse(wishlist, "Item removed from wishlist"));
});

const clearWishlist = asyncHandler(async (req, res) => {
  await wishlistService.clearWishlist(req.user.userId);
  const wishlist = await wishlistService.getWishlist(req.user.userId);
  res.status(200).json(successResponse(wishlist, "Wishlist cleared"));
});

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
};
