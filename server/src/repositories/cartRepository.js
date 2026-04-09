const Cart = require("../models/Cart");

const ensureCartDocument = async (userId) =>
  Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, items: [], promoCode: "" } },
    { new: true, upsert: true, runValidators: true }
  );

const findByUserId = async (userId) => {
  const cart = await ensureCartDocument(userId);
  if (!cart) return null;
  return { user: userId, items: cart.items || [], promoCode: cart.promoCode || "" };
};

const findRawByUserId = async (userId) => {
  const cart = await ensureCartDocument(userId);
  if (!cart) return null;
  return { user: userId, items: cart.items || [], promoCode: cart.promoCode || "" };
};

const upsertByUserId = async (userId, items, promoCode) => {
  const setPayload = { items };
  if (typeof promoCode === "string") setPayload.promoCode = promoCode.trim().toUpperCase();

  const updated = await Cart.findOneAndUpdate(
    { user: userId },
    { $set: setPayload },
    { new: true, runValidators: true, upsert: true }
  );
  if (!updated) return null;
  return { user: userId, items: updated.items || [], promoCode: updated.promoCode || "" };
};

module.exports = {
  findByUserId,
  findRawByUserId,
  upsertByUserId,
};
