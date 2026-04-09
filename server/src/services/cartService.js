const mongoose = require("mongoose");
const cartRepository = require("../repositories/cartRepository");
const productRepository = require("../repositories/productRepository");
const ApiError = require("../utils/ApiError");

const ensureProductExists = async (productId) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product id");
  }
  const product = await productRepository.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");
};

const getCart = async (userId) => {
  const cart = await cartRepository.findByUserId(userId);
  return cart || { user: userId, items: [] };
};

const addItem = async (userId, productId, quantity = 1) => {
  if (quantity <= 0) throw new ApiError(400, "Quantity must be greater than 0");
  await ensureProductExists(productId);

  const cart = (await cartRepository.findRawByUserId(userId)) || { items: [] };
  const existing = cart.items.find((item) => item.product.toString() === productId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({ product: productId, quantity });
  }

  await cartRepository.upsertByUserId(userId, cart.items);
  return getCart(userId);
};

const removeItem = async (userId, productId) => {
  const cart = (await cartRepository.findRawByUserId(userId)) || { items: [] };
  const filtered = cart.items.filter((item) => item.product.toString() !== productId);
  await cartRepository.upsertByUserId(userId, filtered);
  return getCart(userId);
};

const updateItem = async (userId, productId, quantity) => {
  if (quantity < 0) throw new ApiError(400, "Quantity cannot be negative");

  const cart = (await cartRepository.findRawByUserId(userId)) || { items: [] };
  const item = cart.items.find((entry) => entry.product.toString() === productId);

  if (!item) throw new ApiError(404, "Item not found in cart");

  if (quantity === 0) {
    cart.items = cart.items.filter((entry) => entry.product.toString() !== productId);
  } else {
    item.quantity = quantity;
  }

  await cartRepository.upsertByUserId(userId, cart.items);
  return getCart(userId);
};

const clearCart = async (userId) => {
  await cartRepository.upsertByUserId(userId, []);
};

module.exports = {
  getCart,
  addItem,
  removeItem,
  updateItem,
  clearCart,
};
