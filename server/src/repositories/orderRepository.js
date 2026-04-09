const Order = require("../models/Order");

const createOrder = (payload) => Order.create(payload);
const findByUserId = (userId) => Order.find({ user: userId }).populate("items.product").sort({ createdAt: -1 });
const findById = (id) => Order.findById(id).populate("items.product user");
const findAll = () => Order.find({}).populate("items.product user").sort({ createdAt: -1 });
const updateStatus = (id, status) => Order.findByIdAndUpdate(id, { status }, { new: true });

module.exports = {
  createOrder,
  findByUserId,
  findById,
  findAll,
  updateStatus,
};
