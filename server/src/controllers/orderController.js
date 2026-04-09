const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const orderService = require("../services/orderService");

const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrderFromCart(req.user.userId, req.body.address);
  res.status(201).json(successResponse(order, "Order created"));
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getMyOrders(req.user.userId);
  res.status(200).json(successResponse(orders));
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id, req.user);
  res.status(200).json(successResponse(order));
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
};
