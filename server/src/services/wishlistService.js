const mongoose = require("mongoose");
const wishlistRepository = require("../repositories/wishlistRepository");
const productRepository = require("../repositories/productRepository");
const ApiError = require("../utils/ApiError");

const ensureProductExists = async (productId) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product id");
  }
  const product = await productRepository.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");
};

const getWishlist = async (userId) => {
  const wishlist = await wishlistRepository.findByUserId(userId);
  return wishlist || { user: userId, items: [] };
};

const addItem = async (userId, productId) => {
  await ensureProductExists(productId);
  const wishlist = (await wishlistRepository.findRawByUserId(userId)) || { items: [] };
  const exists = wishlist.items.some((item) => item.product.toString() === productId);
  if (!exists) {
    wishlist.items.push({ product: productId, addedAt: new Date() });
    await wishlistRepository.upsertByUserId(userId, wishlist.items);
  }
  return getWishlist(userId);
};

const removeItem = async (userId, productId) => {
  const wishlist = (await wishlistRepository.findRawByUserId(userId)) || { items: [] };
  const filtered = wishlist.items.filter((item) => item.product.toString() !== productId);
  await wishlistRepository.upsertByUserId(userId, filtered);
  return getWishlist(userId);
};

const clearWishlist = async (userId) => {
  await wishlistRepository.upsertByUserId(userId, []);
};

module.exports = {
  getWishlist,
  addItem,
  removeItem,
  clearWishlist,
};
