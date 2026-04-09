const User = require("../models/User");

const findByUserId = async (userId) => {
  const user = await User.findById(userId).select("wishlist");
  if (!user) return null;
  await user.populate("wishlist.product");
  return { user: userId, items: user.wishlist || [] };
};

const findRawByUserId = async (userId) => {
  const user = await User.findById(userId).select("wishlist");
  if (!user) return null;
  return { user: userId, items: user.wishlist || [] };
};

const upsertByUserId = async (userId, items) => {
  const updated = await User.findByIdAndUpdate(
    userId,
    { $set: { wishlist: items } },
    { new: true, runValidators: true, select: "wishlist" }
  );
  if (!updated) return null;
  return { user: userId, items: updated.wishlist || [] };
};

module.exports = {
  findByUserId,
  findRawByUserId,
  upsertByUserId,
};
