const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const orderService = require("../services/orderService");
const PromoCode = require("../models/PromoCode");

const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getAllOrders();
  res.status(200).json(successResponse(orders));
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.params.id, req.body.status);
  res.status(200).json(successResponse(order, "Order status updated"));
});

const listPromoCodes = asyncHandler(async (_req, res) => {
  const promos = await PromoCode.find({}).sort({ createdAt: -1 });
  res.status(200).json(successResponse(promos));
});

const createPromoCode = asyncHandler(async (req, res) => {
  const promo = await PromoCode.create({
    code: req.body?.code,
    discountType: req.body?.discountType,
    discountValue: req.body?.discountValue,
    minSubtotal: req.body?.minSubtotal,
    maxDiscount: req.body?.maxDiscount,
    isActive: req.body?.isActive,
    startsAt: req.body?.startsAt,
    expiresAt: req.body?.expiresAt,
  });
  res.status(201).json(successResponse(promo, "Promo code created"));
});

module.exports = {
  getAllOrders,
  updateOrderStatus,
  listPromoCodes,
  createPromoCode,
};
