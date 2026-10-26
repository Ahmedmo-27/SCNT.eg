const mongoose = require("mongoose");
const cartRepository = require("../repositories/cartRepository");
const productRepository = require("../repositories/productRepository");
const PromoCode = require("../models/PromoCode");
const Order = require("../models/Order");
const ApiError = require("../utils/ApiError");
const { getCache, setCache, deleteCache } = require("../utils/cache");
const {
  normalizePromoCode,
  getItemProductId,
  getProductPriceForSize,
  hasProductRestrictions,
  isPromoApplicableToCart,
  getPromoIfValid,
  calculateDiscount,
} = require("../utils/promoHelper");

const SHIPPING_FEE_EGP = 80;

const normalizeOwner = (ownerArg) => {
  if (typeof ownerArg === "string") {
    return { userId: ownerArg, visitorId: null, sessionId: null };
  }
  if (ownerArg && typeof ownerArg === "object") {
    return {
      userId: ownerArg.userId || null,
      visitorId: ownerArg.visitorId ? String(ownerArg.visitorId).trim() : null,
      sessionId: ownerArg.sessionId ? String(ownerArg.sessionId).trim() : null,
    };
  }
  throw new ApiError(400, "Missing user or visitor identifier for cart");
};

const getCacheKey = (owner) => {
  if (owner?.userId) return `cart:user:${owner.userId}`;
  if (owner?.visitorId) return `cart:guest:${owner.visitorId}`;
  return null;
};

const ensureProductExists = async (productId) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product id");
  }
  const product = await productRepository.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");
};

const formatMoney = (value) => {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0";
  return n.toFixed(0);
};

const buildCartResponse = async (owner, items, promoCode) => {
  const normOwner = normalizeOwner(owner);
  const productIds = items.map((item) => getItemProductId(item)).filter(Boolean);
  const products = productIds.length > 0 ? await productRepository.findByIds(productIds) : [];
  const productMap = new Map(products.map((product) => [product._id.toString(), product]));

  const subtotal = items.reduce((sum, item) => {
    const productId = getItemProductId(item);
    const product = productMap.get(productId);
    const price = getProductPriceForSize(product, item.size);
    return sum + price * Number(item.quantity || 0);
  }, 0);

  const promo = await getPromoIfValid(promoCode, subtotal, items);
  const discount = calculateDiscount(promo, subtotal, items, productMap);
  const shipping = items.length > 0 ? SHIPPING_FEE_EGP : 0;
  const total = Math.max(0, subtotal + shipping - discount);

  const lines = items.map((item) => {
    const productId = getItemProductId(item);
    const product = productMap.get(productId);
    const size = item.size || "100ml";
    const unitPrice = getProductPriceForSize(product, size);
    const quantity = Number(item.quantity || 0);
    return {
      productId,
      size,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
      name: product?.name || "",
      image: Array.isArray(product?.images) ? product.images[0] || "" : "",
    };
  });

  return {
    user: normOwner.userId,
    visitorId: normOwner.visitorId,
    items,
    lines,
    promoCode: promo?.code || "",
    summary: {
      subtotal,
      shipping,
      discount,
      total,
    },
    appliedPromo: promo
      ? {
          code: promo.code,
          discountType: promo.discountType,
          discountValue: Number(promo.discountValue),
          discountScope: promo.discountScope || "CERTAIN_PRODUCTS",
          applicableSizes: promo.applicableSizes || [],
          minSubtotal: Number(promo.minSubtotal || 0),
          maxDiscount: promo.maxDiscount == null ? null : Number(promo.maxDiscount),
          discountAmount: discount,
          applicableProducts: Array.isArray(promo.applicableProducts)
            ? promo.applicableProducts.map((ap) => ({
                product: (ap.product?._id || ap.product).toString(),
                maxCount: ap.maxCount != null ? Number(ap.maxCount) : null,
                sizes: ap.sizes || [],
              }))
            : [],
        }
      : null,
  };
};

const getCart = async (ownerArg) => {
  const owner = normalizeOwner(ownerArg);
  const cacheKey = getCacheKey(owner);

  if (cacheKey) {
    const cachedCart = await getCache(cacheKey);
    if (cachedCart) {
      return cachedCart;
    }
  }

  const cart = await cartRepository.findByOwner(owner);
  if (!cart) {
    const response = await buildCartResponse(owner, [], "");
    if (cacheKey) await setCache(cacheKey, response, 1800);
    return response;
  }

  const response = await buildCartResponse(owner, cart.items || [], cart.promoCode || "");
  if ((cart.promoCode || "") !== response.promoCode) {
    await cartRepository.upsertByOwner(owner, cart.items || [], response.promoCode);
  }

  if (cacheKey) await setCache(cacheKey, response, 1800);
  return response;
};

const addItem = async (ownerArg, productId, quantity = 1, size = "100ml") => {
  const owner = normalizeOwner(ownerArg);
  if (quantity <= 0) throw new ApiError(400, "Quantity must be greater than 0");
  await ensureProductExists(productId);

  const cart = (await cartRepository.findRawByOwner(owner)) || { items: [], promoCode: "" };
  const normSize = String(size || "100ml").trim();
  const existing = cart.items.find(
    (item) => item.product.toString() === productId && (item.size || "100ml") === normSize
  );

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({ product: productId, size: normSize, quantity });
  }

  await cartRepository.upsertByOwner(owner, cart.items, cart.promoCode || "");

  const cacheKey = getCacheKey(owner);
  if (cacheKey) await deleteCache(cacheKey);

  return getCart(owner);
};

const removeItem = async (ownerArg, productId, size) => {
  const owner = normalizeOwner(ownerArg);
  const cart = (await cartRepository.findRawByOwner(owner)) || { items: [], promoCode: "" };
  const normSize = size ? String(size).trim() : null;
  const filtered = normSize
    ? cart.items.filter(
        (item) => !(item.product.toString() === productId && (item.size || "100ml") === normSize)
      )
    : cart.items.filter((item) => item.product.toString() !== productId);

  await cartRepository.upsertByOwner(owner, filtered, cart.promoCode || "");

  const cacheKey = getCacheKey(owner);
  if (cacheKey) await deleteCache(cacheKey);

  return getCart(owner);
};

const updateItem = async (ownerArg, productId, quantity, size = "100ml") => {
  const owner = normalizeOwner(ownerArg);
  if (quantity < 0) throw new ApiError(400, "Quantity cannot be negative");

  const cart = (await cartRepository.findRawByOwner(owner)) || { items: [], promoCode: "" };
  const normSize = String(size || "100ml").trim();
  const item = cart.items.find(
    (entry) => entry.product.toString() === productId && (entry.size || "100ml") === normSize
  );

  if (!item) throw new ApiError(404, "Item not found in cart");

  if (quantity === 0) {
    cart.items = cart.items.filter(
      (entry) => !(entry.product.toString() === productId && (entry.size || "100ml") === normSize)
    );
  } else {
    item.quantity = quantity;
  }

  await cartRepository.upsertByOwner(owner, cart.items, cart.promoCode || "");

  const cacheKey = getCacheKey(owner);
  if (cacheKey) await deleteCache(cacheKey);

  return getCart(owner);
};

const replaceItems = async (ownerArg, lines) => {
  const owner = normalizeOwner(ownerArg);
  if (!Array.isArray(lines)) {
    throw new ApiError(400, "Lines must be an array");
  }

  const cart = (await cartRepository.findRawByOwner(owner)) || { items: [], promoCode: "" };
  const normalizedItems = [];
  for (const line of lines) {
    const productId = line?.productId;
    const size = String(line?.size || "100ml").trim();
    const quantity = Number(line?.quantity);
    if (!mongoose.isValidObjectId(productId)) {
      throw new ApiError(400, "Invalid product id");
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new ApiError(400, "Quantity must be greater than 0");
    }
    await ensureProductExists(productId);
    normalizedItems.push({ product: productId, size, quantity });
  }

  await cartRepository.upsertByOwner(owner, normalizedItems, cart.promoCode || "");

  const cacheKey = getCacheKey(owner);
  if (cacheKey) await deleteCache(cacheKey);

  return getCart(owner);
};

const applyPromoCode = async (ownerArg, code) => {
  const owner = normalizeOwner(ownerArg);
  const normalized = normalizePromoCode(code);
  if (!normalized) throw new ApiError(400, "Promo code is required");

  const cart = (await cartRepository.findRawByOwner(owner)) || { items: [], promoCode: "" };
  if (!cart.items.length) throw new ApiError(400, "Cart is empty");

  const promo = await PromoCode.findOne({ code: normalized });
  if (!promo) {
    throw new ApiError(400, "Promo code does not exist.");
  }

  const rejectionReasons = [];
  if (!promo.isActive) rejectionReasons.push("This promo code is inactive.");

  const now = Date.now();
  if (promo.startsAt && new Date(promo.startsAt).getTime() > now + 60000) {
    rejectionReasons.push("This promo code is not active yet.");
  }
  if (promo.expiresAt && new Date(promo.expiresAt).getTime() < now) {
    rejectionReasons.push("This promo code has expired.");
  }

  const preview = await buildCartResponse(owner, cart.items, "");
  const subtotal = Number(preview.summary?.subtotal || 0);
  if (subtotal < Number(promo.minSubtotal || 0)) {
    rejectionReasons.push(
      `Minimum subtotal is EGP ${formatMoney(promo.minSubtotal)} (current: EGP ${formatMoney(subtotal)}).`
    );
  }

  if (owner.userId) {
    const usedBefore = await Order.exists({
      user: owner.userId,
      promoCode: normalized,
    });
    if (usedBefore) {
      rejectionReasons.push("You have already used this promo code before.");
    }
  }

  if (hasProductRestrictions(promo)) {
    if (!isPromoApplicableToCart(promo, cart.items)) {
      rejectionReasons.push("None of the items in your cart are eligible for this promo code.");
    }
  }

  if (rejectionReasons.length > 0) {
    throw new ApiError(400, rejectionReasons.join(" "));
  }

  await cartRepository.upsertByOwner(owner, cart.items, normalized);

  const cacheKey = getCacheKey(owner);
  if (cacheKey) await deleteCache(cacheKey);

  return getCart(owner);
};

const removePromoCode = async (ownerArg) => {
  const owner = normalizeOwner(ownerArg);
  const cart = (await cartRepository.findRawByOwner(owner)) || { items: [], promoCode: "" };
  await cartRepository.upsertByOwner(owner, cart.items, "");

  const cacheKey = getCacheKey(owner);
  if (cacheKey) await deleteCache(cacheKey);

  return getCart(owner);
};

const CartModel = require("../models/Cart");
const emailService = require("./emailService");
const env = require("../config/env");

const clearCart = async (ownerArg) => {
  const owner = normalizeOwner(ownerArg);
  await cartRepository.upsertByOwner(owner, [], "");

  const cacheKey = getCacheKey(owner);
  if (cacheKey) await deleteCache(cacheKey);
};

const updateContact = async (ownerArg, contactData) => {
  const owner = normalizeOwner(ownerArg);
  const cart = await cartRepository.findRawByOwner(owner);
  if (!cart) return null;

  const update = {};
  if (contactData.fullName !== undefined) update["contact.fullName"] = String(contactData.fullName).trim();
  if (contactData.phone !== undefined) update["contact.phone"] = String(contactData.phone).trim();
  if (contactData.email !== undefined) update["contact.email"] = String(contactData.email).trim().toLowerCase();
  if (contactData.governorate !== undefined) update["contact.governorate"] = String(contactData.governorate).trim();
  if (contactData.city !== undefined) update["contact.city"] = String(contactData.city).trim();
  if (contactData.address !== undefined) update["contact.address"] = String(contactData.address).trim();

  await CartModel.updateOne({ _id: cart._id }, { $set: update });
  return getCart(owner);
};

const restoreCart = async (ownerArg, sourceCartId) => {
  const owner = normalizeOwner(ownerArg);
  if (!mongoose.isValidObjectId(sourceCartId)) {
    throw new ApiError(400, "Invalid cart id");
  }

  const sourceCart = await CartModel.findById(sourceCartId).lean();
  if (!sourceCart || !Array.isArray(sourceCart.items) || sourceCart.items.length === 0) {
    throw new ApiError(404, "Source cart not found or has no items");
  }

  await cartRepository.upsertByOwner(owner, sourceCart.items, sourceCart.promoCode || "");
  const cacheKey = getCacheKey(owner);
  if (cacheKey) await deleteCache(cacheKey);

  return getCart(owner);
};

const sendCartRecoveryEmail = async (cartId) => {
  if (!mongoose.isValidObjectId(cartId)) {
    throw new ApiError(400, "Invalid cart id");
  }

  const cart = await CartModel.findById(cartId)
    .populate("user", "email full_name")
    .populate("items.product", "name price sizes images")
    .lean();

  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    throw new ApiError(404, "Cart not found or empty");
  }

  const recipientEmail = cart.user?.email || cart.contact?.email;
  if (!recipientEmail) {
    throw new ApiError(400, "No email address found for this cart");
  }

  const customerName = cart.user?.full_name || cart.contact?.fullName || "there";
  const items = (cart.items || []).map((i) => {
    const prod = i.product || {};
    const price = getProductPriceForSize(prod, i.size);
    const qty = Number(i.quantity || 1);
    return {
      name: `${prod.name || "SCNT Fragrance"} (${i.size || "100ml"})`,
      quantity: qty,
      unitPrice: price,
      lineTotal: price * qty,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const total = subtotal + SHIPPING_FEE_EGP;

  const clientBase = (env.clientBaseUrl || "https://scnt.eg").replace(/\/+$/, "");
  const recoveryUrl = `${clientBase}/cart?restore=${cart._id}`;

  const emailResult = await emailService.sendAbandonedCartRecoveryEmail({
    to: recipientEmail,
    customerName,
    items,
    total,
    recoveryUrl,
  });

  await CartModel.updateOne(
    { _id: cart._id },
    {
      $set: { recoverySentAt: new Date() },
      $inc: { recoveryCount: 1 },
    }
  );

  return { success: true, email: recipientEmail, emailResult };
};

module.exports = {
  getCart,
  addItem,
  removeItem,
  updateItem,
  replaceItems,
  applyPromoCode,
  removePromoCode,
  clearCart,
  updateContact,
  restoreCart,
  sendCartRecoveryEmail,
};
