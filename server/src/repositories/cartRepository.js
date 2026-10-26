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

/**
 * Merge guest cart into user cart upon login, registration, or authenticated cart access.
 */
const mergeGuestCartIntoUserCart = async (visitorId, userId) => {
  if (!visitorId || !userId) return null;

  const cleanVisitorId = String(visitorId).trim();
  const guestCart = await Cart.findOne({
    visitorId: cleanVisitorId,
    $or: [{ user: null }, { user: { $exists: false } }],
  });
  if (!guestCart) return null;

  // If the guest cart had no items, remove it so visitorId unique index is freed
  if (!guestCart.items || guestCart.items.length === 0) {
    await Cart.deleteOne({ _id: guestCart._id });
    return null;
  }

  let userCart = await Cart.findOne({ user: userId });
  if (!userCart) {
    // Directly convert guest cart to user cart and unset visitorId
    await Cart.updateOne(
      { _id: guestCart._id },
      {
        $set: { user: userId, lastActiveAt: new Date() },
        $unset: { visitorId: 1 },
      }
    );
    return Cart.findById(guestCart._id);
  }

  const userItems = [...(userCart.items || [])];

  for (const guestItem of guestCart.items) {
    const guestSize = guestItem.size || "100ml";
    const existingIndex = userItems.findIndex(
      (i) =>
        i.product.toString() === guestItem.product.toString() &&
        (i.size || "100ml") === guestSize
    );
    if (existingIndex >= 0) {
      userItems[existingIndex].quantity += guestItem.quantity;
    } else {
      userItems.push({
        product: guestItem.product,
        size: guestSize,
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

  // Clear or remove guest cart to avoid double-counting and release visitorId
  await Cart.deleteOne({ _id: guestCart._id });

  return userCart;
};

const ensureCartDocument = async (owner = {}) => {
  if (owner.userId && owner.visitorId) {
    try {
      await mergeGuestCartIntoUserCart(owner.visitorId, owner.userId);
    } catch {
      // non-blocking
    }
  }

  const query = buildOwnerQuery(owner);
  if (!query) return null;

  const setOnInsert = {
    items: [],
    promoCode: "",
  };
  if (owner.userId) {
    setOnInsert.user = owner.userId;
    // Do NOT set visitorId on user cart to avoid unique index conflict
  } else if (owner.visitorId) {
    setOnInsert.visitorId = String(owner.visitorId).trim();
  }
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
  if (owner?.userId && owner?.visitorId) {
    try {
      await mergeGuestCartIntoUserCart(owner.visitorId, owner.userId);
    } catch {
      // non-blocking
    }
  }

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
  if (owner?.userId && owner?.visitorId) {
    try {
      await mergeGuestCartIntoUserCart(owner.visitorId, owner.userId);
    } catch {
      // non-blocking
    }
  }

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
  if (owner.userId) {
    setOnInsert.user = owner.userId;
    // Do NOT set visitorId on user cart to avoid unique index conflict
  } else if (owner.visitorId) {
    setOnInsert.visitorId = String(owner.visitorId).trim();
  }

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
      .populate("items.product", "name price sizes images coverImage stock is_active slug SCNTcollection")
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
