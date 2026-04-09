const Order = require("../models/Order");
const User = require("../models/User");

const ensureUserOrdersLinked = async (user) => {
  if (!user) return null;
  if (Array.isArray(user.orders) && user.orders.length > 0) return user;

  const legacyOrders = await Order.find({ user: user._id }).select("_id").sort({ createdAt: -1 });
  if (legacyOrders.length === 0) return user;

  user.orders = legacyOrders.map((order) => order._id);
  await user.save();
  return user;
};

const createOrder = async (payload) => {
  const order = await Order.create(payload);
  await User.findByIdAndUpdate(payload.user, { $addToSet: { orders: order._id } });
  return order;
};

const findByUserId = async (userId) => {
  let user = await User.findById(userId).select("orders");
  user = await ensureUserOrdersLinked(user);
  if (!user || !Array.isArray(user.orders) || user.orders.length === 0) return [];

  const populatedUser = await User.findById(userId)
    .select("orders")
    .populate({
      path: "orders",
      options: { sort: { createdAt: -1 } },
      populate: { path: "items.product" },
    });

  return populatedUser?.orders || [];
};

const findById = (id) => Order.findById(id).populate("items.product user");
const userHasOrder = async (userId, orderId) => {
  let user = await User.findById(userId).select("orders");
  user = await ensureUserOrdersLinked(user);
  if (!user) return false;
  return user.orders.some((id) => id.toString() === orderId.toString());
};

const findAll = () => Order.find({}).populate("items.product user").sort({ createdAt: -1 });
const updateStatus = (id, status) => Order.findByIdAndUpdate(id, { status }, { new: true });

module.exports = {
  createOrder,
  findByUserId,
  findById,
  userHasOrder,
  findAll,
  updateStatus,
};
