const Cart = require("../models/Cart");

const findByUserId = (userId) => Cart.findOne({ user: userId }).populate("items.product");

const findRawByUserId = (userId) => Cart.findOne({ user: userId });

const upsertByUserId = (userId, items) =>
  Cart.findOneAndUpdate({ user: userId }, { user: userId, items }, { new: true, upsert: true });

module.exports = {
  findByUserId,
  findRawByUserId,
  upsertByUserId,
};
