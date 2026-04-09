const User = require("../models/User");
const Cart = require("../models/Cart");

const migrateLegacyCartIfNeeded = async (userId, user) => {
  if (!user) return null;
  if (Array.isArray(user.cart) && user.cart.length > 0) return user;

  const legacy = await Cart.findOne({ user: userId }).select("items");
  if (!legacy || !Array.isArray(legacy.items) || legacy.items.length === 0) return user;

  user.cart = legacy.items;
  await user.save();
  await Cart.deleteOne({ user: userId });
  return user;
};

const findByUserId = async (userId) => {
  let user = await User.findById(userId).select("cart");
  user = await migrateLegacyCartIfNeeded(userId, user);
  if (!user) return null;
  await user.populate("cart.product");
  return { user: userId, items: user.cart || [] };
};

const findRawByUserId = async (userId) => {
  let user = await User.findById(userId).select("cart");
  user = await migrateLegacyCartIfNeeded(userId, user);
  if (!user) return null;
  return { user: userId, items: user.cart || [] };
};

const upsertByUserId = async (userId, items) => {
  const updated = await User.findByIdAndUpdate(
    userId,
    { $set: { cart: items } },
    { new: true, runValidators: true, select: "cart" }
  );
  if (!updated) return null;
  return { user: userId, items: updated.cart || [] };
};

module.exports = {
  findByUserId,
  findRawByUserId,
  upsertByUserId,
};
