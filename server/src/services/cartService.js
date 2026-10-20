const mongoose = require("mongoose");
const cartRepository = require("../repositories/cartRepository");
const productRepository = require("../repositories/productRepository");
const PromoCode = require("../models/PromoCode");
const Order = require("../models/Order");
const ApiError = require("../utils/ApiError");
const { getCache, setCache, deleteCache } = require("../utils/cache");

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

const getProductPriceForSize = (product, size) => {
  const normSize = String(size || "").toLowerCase().replace(/\s+/g, "");
  if (normSize === "50ml") {
    const opt = product?.sizes?.find(
      (s) => String(s.size).toLowerCase().replace(/\s+/g, "") === "50ml"
    );
    return opt ? Number(opt.price) : 500;
  }
  const opt = product?.sizes?.find(
    (s) => String(s.size).toLowerCase().replace(/\s+/g, "") === "100ml"
  );
  return opt ? Number(opt.price) : Number(product?.price || 750);
};

const ensureProductExists = async (productId) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product id");
  }
  const product = await productRepository.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");
};

const normalizePromoCode = (code = "") => String(code).trim().toUpperCase();

const formatMoney = (value) => {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0";
  return n.toFixed(0);
};

const getItemProductId = (item) => {
  const raw = item?.product;
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw._id) return raw._id.toString();
  return raw.toString();
};

const getPromoIfValid = async (promoCode, subtotal) => {
  const normalized = normalizePromoCode(promoCode);
  if (!normalized) return null;

  const promo = await PromoCode.findOne({ code: normalized, isActive: true });
  if (!promo) return null;

  const now = Date.now();
  if (promo.startsAt && new Date(promo.startsAt).getTime() > now) return null;
  if (promo.expiresAt && new Date(promo.expiresAt).getTime() < now) return null;
  if (subtotal < Number(promo.minSubtotal || 0)) return null;
  return promo;
};

const calculateDiscount = (promo, subtotal) => {
  if (!promo || subtotal <= 0) return 0;
  let discount = 0;

  if (promo.discountType === "PERCENTAGE") {
    discount = (subtotal * Number(promo.discountValue || 0)) / 100;
  } else {
    discount = Number(promo.discountValue || 0);
  }

  const maxDiscount = promo.maxDiscount == null ? null : Number(promo.maxDiscount);
  if (maxDiscount != null && Number.isFinite(maxDiscount)) {
    discount = Math.min(discount, maxDiscount);
  }

  discount = Math.max(0, discount);
  return Math.min(discount, subtotal);
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

  const promo = await getPromoIfValid(promoCode, subtotal);
  const discount = calculateDiscount(promo, subtotal);
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
          minSubtotal: Number(promo.minSubtotal || 0),
          maxDiscount: promo.maxDiscount == null ? null : Number(promo.maxDiscount),
          discountAmount: discount,
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
  if (promo.startsAt && new Date(promo.startsAt).getTime() > now) {
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

const clearCart = async (ownerArg) => {
  const owner = normalizeOwner(ownerArg);
  await cartRepository.upsertByOwner(owner, [], "");

  const cacheKey = getCacheKey(owner);
  if (cacheKey) await deleteCache(cacheKey);
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
};
