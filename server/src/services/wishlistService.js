const mongoose = require("mongoose");
const wishlistRepository = require("../repositories/wishlistRepository");
const productRepository = require("../repositories/productRepository");
const ApiError = require("../utils/ApiError");
const { getCache, setCache, deleteCache } = require("../utils/cache");

const ensureProductExists = async (productId) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product id");
  }
  const product = await productRepository.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");
};

const getWishlist = async (userId) => {
  const cacheKey = `wishlist:${userId}`;

  // Try to get from cache
  const cachedWishlist = await getCache(cacheKey);
  if (cachedWishlist) {
    return cachedWishlist;
  }

  const wishlist = await wishlistRepository.findByUserId(userId);
  const result = wishlist || { user: userId, items: [] };

  // Cache the result for 30 minutes
  await setCache(cacheKey, result, 1800);

  return result;
};

const addItem = async (userId, productId) => {
  await ensureProductExists(productId);
  const wishlist = (await wishlistRepository.findRawByUserId(userId)) || { items: [] };
  const exists = wishlist.items.some((item) => item.product.toString() === productId);
  if (!exists) {
    wishlist.items.push({ product: productId, addedAt: new Date() });
    await wishlistRepository.upsertByUserId(userId, wishlist.items);
  }
  
  // Invalidate cache
  await deleteCache(`wishlist:${userId}`);
  
  return getWishlist(userId);
};

const removeItem = async (userId, productId) => {
  const wishlist = (await wishlistRepository.findRawByUserId(userId)) || { items: [] };
  const filtered = wishlist.items.filter((item) => item.product.toString() !== productId);
  await wishlistRepository.upsertByUserId(userId, filtered);
  
  // Invalidate cache
  await deleteCache(`wishlist:${userId}`);
  
  return getWishlist(userId);
};

const clearWishlist = async (userId) => {
  await wishlistRepository.upsertByUserId(userId, []);
  
  // Invalidate cache
  await deleteCache(`wishlist:${userId}`);
};

module.exports = {
  getWishlist,
  addItem,
  removeItem,
  clearWishlist,
};
