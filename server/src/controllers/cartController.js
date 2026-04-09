const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const cartService = require("../services/cartService");

const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user.userId);
  res.status(200).json(successResponse(cart));
});

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const cart = await cartService.addItem(req.user.userId, productId, Number(quantity || 1));
  res.status(200).json(successResponse(cart, "Item added to cart"));
});

const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const cart = await cartService.removeItem(req.user.userId, productId);
  res.status(200).json(successResponse(cart, "Item removed from cart"));
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const cart = await cartService.updateItem(req.user.userId, productId, Number(quantity));
  res.status(200).json(successResponse(cart, "Cart updated"));
});

const clearCart = asyncHandler(async (req, res) => {
  await cartService.clearCart(req.user.userId);
  const cart = await cartService.getCart(req.user.userId);
  res.status(200).json(successResponse(cart, "Cart cleared"));
});

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  updateCartItem,
  clearCart,
};
