const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const cartService = require("../services/cartService");
const ApiError = require("../utils/ApiError");

const resolveOwner = (req) => {
  const userId = req.user?.userId || null;
  const visitorId =
    req.headers["x-visitor-id"] ||
    req.body?.visitorId ||
    req.query?.visitorId ||
    null;
  const sessionId =
    req.headers["x-session-id"] ||
    req.body?.sessionId ||
    req.query?.sessionId ||
    null;

  if (!userId && !visitorId) {
    throw new ApiError(400, "Missing user authentication or visitor identifier");
  }

  return {
    userId,
    visitorId: visitorId ? String(visitorId).trim() : null,
    sessionId: sessionId ? String(sessionId).trim() : null,
  };
};

const getCart = asyncHandler(async (req, res) => {
  const owner = resolveOwner(req);
  const cart = await cartService.getCart(owner);
  res.status(200).json(successResponse(cart));
});

const addToCart = asyncHandler(async (req, res) => {
  const owner = resolveOwner(req);
  const { productId, quantity, size } = req.body;
  const cart = await cartService.addItem(owner, productId, Number(quantity || 1), size);
  res.status(200).json(successResponse(cart, "Item added to cart"));
});

const removeFromCart = asyncHandler(async (req, res) => {
  const owner = resolveOwner(req);
  const { productId, size } = req.body;
  const cart = await cartService.removeItem(owner, productId, size);
  res.status(200).json(successResponse(cart, "Item removed from cart"));
});

const updateCartItem = asyncHandler(async (req, res) => {
  const owner = resolveOwner(req);
  const { productId, quantity, size } = req.body;
  const cart = await cartService.updateItem(owner, productId, Number(quantity), size);
  res.status(200).json(successResponse(cart, "Cart updated"));
});

const replaceCart = asyncHandler(async (req, res) => {
  const owner = resolveOwner(req);
  const lines = Array.isArray(req.body?.lines) ? req.body.lines : [];
  const cart = await cartService.replaceItems(owner, lines);
  res.status(200).json(successResponse(cart, "Cart replaced"));
});

const applyPromoCode = asyncHandler(async (req, res) => {
  const owner = resolveOwner(req);
  const cart = await cartService.applyPromoCode(owner, req.body?.code);
  res.status(200).json(successResponse(cart, "Promo code applied"));
});

const removePromoCode = asyncHandler(async (req, res) => {
  const owner = resolveOwner(req);
  const cart = await cartService.removePromoCode(owner);
  res.status(200).json(successResponse(cart, "Promo code removed"));
});

const clearCart = asyncHandler(async (req, res) => {
  const owner = resolveOwner(req);
  await cartService.clearCart(owner);
  const cart = await cartService.getCart(owner);
  res.status(200).json(successResponse(cart, "Cart cleared"));
});

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  updateCartItem,
  replaceCart,
  applyPromoCode,
  removePromoCode,
  clearCart,
};
