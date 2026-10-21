const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const orderService = require("../services/orderService");
const ApiError = require("../utils/ApiError");

const resolveOrderOwner = (req) => {
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

const createOrder = asyncHandler(async (req, res) => {
  const owner = resolveOrderOwner(req);
  const { address, customerEmail } = req.body;
  const order = await orderService.createOrderFromCart(owner, address, customerEmail);
  res.status(201).json(successResponse(order, "Order created"));
});

const getMyOrders = asyncHandler(async (req, res) => {
  if (!req.user?.userId) {
    throw new ApiError(401, "Authentication required to view order history");
  }
  const orders = await orderService.getMyOrders(req.user.userId);
  res.status(200).json(successResponse(orders));
});

const getOrderById = asyncHandler(async (req, res) => {
  const visitorId = req.headers["x-visitor-id"] || req.query?.visitorId || null;
  const order = await orderService.getOrderById(req.params.id, req.user, visitorId);
  res.status(200).json(successResponse(order));
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
};
