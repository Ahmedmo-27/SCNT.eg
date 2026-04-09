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
  let user = await User.findById(userId).select("cart cartPromoCode");
  user = await migrateLegacyCartIfNeeded(userId, user);
  if (!user) return null;
  await user.populate("cart.product");
  return { user: userId, items: user.cart || [], promoCode: user.cartPromoCode || "" };
};

const findRawByUserId = async (userId) => {
  let user = await User.findById(userId).select("cart cartPromoCode");
  user = await migrateLegacyCartIfNeeded(userId, user);
  if (!user) return null;
  return { user: userId, items: user.cart || [], promoCode: user.cartPromoCode || "" };
};

const upsertByUserId = async (userId, items, promoCode) => {
  const setPayload = { cart: items };
  if (typeof promoCode === "string") {
    setPayload.cartPromoCode = promoCode.trim().toUpperCase();
  }

  const updated = await User.findByIdAndUpdate(
    userId,
    { $set: setPayload },
    { new: true, runValidators: true, select: "cart cartPromoCode" }
  );
  if (!updated) return null;
  return { user: userId, items: updated.cart || [], promoCode: updated.cartPromoCode || "" };
};

module.exports = {
  findByUserId,
  findRawByUserId,
  upsertByUserId,
};
