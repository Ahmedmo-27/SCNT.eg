const Cart = require("../models/Cart");
require("../models/Product");
require("../models/User");

/**
 * Build MongoDB query filter based on owner identity.
 * Prioritizes registered user ID over guest visitor ID.
 */
const buildOwnerQuery = (owner = {}) => {
  if (owner?.userId) {
    return { user: owner.userId };
  }
  if (owner?.visitorId) {
    return { visitorId: String(owner.visitorId).trim() };
  }
  return null;
};

const ensureCartDocument = async (owner = {}) => {
  const query = buildOwnerQuery(owner);
  if (!query) return null;

  const setOnInsert = {
    items: [],
    promoCode: "",
  };
  if (owner.userId) setOnInsert.user = owner.userId;
  if (owner.visitorId) setOnInsert.visitorId = String(owner.visitorId).trim();
  if (owner.sessionId) setOnInsert.sessionId = String(owner.sessionId).trim();

  return Cart.findOneAndUpdate(
    query,
    {
      $setOnInsert: setOnInsert,
      $set: { lastActiveAt: new Date() },
    },
    { new: true, upsert: true, runValidators: true }
  );
};

const findByOwner = async (owner = {}) => {
  const cart = await ensureCartDocument(owner);
  if (!cart) return null;
  return {
    _id: cart._id,
    user: cart.user,
    visitorId: cart.visitorId,
    sessionId: cart.sessionId,
    items: cart.items || [],
    promoCode: cart.promoCode || "",
    lastActiveAt: cart.lastActiveAt,
  };
};

const findRawByOwner = async (owner = {}) => {
  const query = buildOwnerQuery(owner);
  if (!query) return null;
  const cart = await Cart.findOne(query);
  if (!cart) return null;
  return {
    _id: cart._id,
    user: cart.user,
    visitorId: cart.visitorId,
    sessionId: cart.sessionId,
    items: cart.items || [],
    promoCode: cart.promoCode || "",
    lastActiveAt: cart.lastActiveAt,
  };
};

const upsertByOwner = async (owner = {}, items, promoCode) => {
  const query = buildOwnerQuery(owner);
  if (!query) return null;

  const setPayload = {
    items: Array.isArray(items) ? items : [],
    lastActiveAt: new Date(),
  };
  if (typeof promoCode === "string") {
    setPayload.promoCode = promoCode.trim().toUpperCase();
  }
  if (owner.sessionId) {
    setPayload.sessionId = String(owner.sessionId).trim();
  }

  const setOnInsert = {};
  if (owner.userId) setOnInsert.user = owner.userId;
  if (owner.visitorId) setOnInsert.visitorId = String(owner.visitorId).trim();

  const updated = await Cart.findOneAndUpdate(
    query,
    {
      $set: setPayload,
      $setOnInsert: setOnInsert,
    },
    { new: true, runValidators: true, upsert: true }
  );

  if (!updated) return null;
  return {
    _id: updated._id,
    user: updated.user,
    visitorId: updated.visitorId,
    sessionId: updated.sessionId,
    items: updated.items || [],
    promoCode: updated.promoCode || "",
    lastActiveAt: updated.lastActiveAt,
  };
};

// Backward-compatible wrappers for existing code
const findByUserId = async (userId) => findByOwner({ userId });
const findRawByUserId = async (userId) => findRawByOwner({ userId });
const upsertByUserId = async (userId, items, promoCode) =>
  upsertByOwner({ userId }, items, promoCode);

/**
 * Merge guest cart into user cart upon login or registration.
 */
const mergeGuestCartIntoUserCart = async (visitorId, userId) => {
  if (!visitorId || !userId) return null;

  const guestCart = await Cart.findOne({
    visitorId: String(visitorId).trim(),
    $or: [{ user: null }, { user: { $exists: false } }],
  });
  if (!guestCart || !guestCart.items || guestCart.items.length === 0) {
    return null;
  }

  const userCart =
    (await Cart.findOne({ user: userId })) ||
    (await Cart.create({
      user: userId,
      items: [],
      promoCode: "",
      lastActiveAt: new Date(),
    }));

  const userItems = [...(userCart.items || [])];

  for (const guestItem of guestCart.items) {
    const existingIndex = userItems.findIndex(
      (i) => i.product.toString() === guestItem.product.toString()
    );
    if (existingIndex >= 0) {
      userItems[existingIndex].quantity += guestItem.quantity;
    } else {
      userItems.push({
        product: guestItem.product,
        size: guestItem.size || "100ml",
        quantity: guestItem.quantity,
      });
    }
  }

  userCart.items = userItems;
  if (!userCart.promoCode && guestCart.promoCode) {
    userCart.promoCode = guestCart.promoCode;
  }
  userCart.lastActiveAt = new Date();
  await userCart.save();

  // Clear or remove guest cart to avoid double-counting
  await Cart.deleteOne({ _id: guestCart._id });

  return userCart;
};

/**
 * Admin: Query all carts with products in them.
 */
const findAllCartsWithItems = async ({
  status = "all", // "all" | "active" | "abandoned"
  type = "all", // "all" | "registered" | "guest"
  search = "",
  page = 1,
  limit = 25,
} = {}) => {
  const filter = { "items.0": { $exists: true } };

  // Two hours threshold for cart abandonment
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  if (status === "active") {
    filter.lastActiveAt = { $gte: twoHoursAgo };
  } else if (status === "abandoned") {
    filter.lastActiveAt = { $lt: twoHoursAgo };
  }

  if (type === "registered") {
    filter.user = { $exists: true, $ne: null };
  } else if (type === "guest") {
    filter.$or = [{ user: null }, { user: { $exists: false } }];
  }

  const skip = (Math.max(1, page) - 1) * limit;

  const [carts, total] = await Promise.all([
    Cart.find(filter)
      .sort({ lastActiveAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "full_name email phone address")
      .populate("items.product", "name price images coverImage stock is_active slug SCNTcollection")
      .lean(),
    Cart.countDocuments(filter),
  ]);

  return { carts, total, page, limit, pages: Math.ceil(total / limit) || 1 };
};

module.exports = {
  buildOwnerQuery,
  ensureCartDocument,
  findByOwner,
  findRawByOwner,
  upsertByOwner,
  findByUserId,
  findRawByUserId,
  upsertByUserId,
  mergeGuestCartIntoUserCart,
  findAllCartsWithItems,
};
