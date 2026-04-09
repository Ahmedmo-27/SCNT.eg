const mongoose = require("mongoose");
const cartRepository = require("../repositories/cartRepository");
const productRepository = require("../repositories/productRepository");
const PromoCode = require("../models/PromoCode");
const Order = require("../models/Order");
const ApiError = require("../utils/ApiError");

const SHIPPING_FEE_EGP = 80;

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

const buildCartResponse = async (userId, items, promoCode) => {
  const productIds = items.map((item) => getItemProductId(item)).filter(Boolean);
  const products = productIds.length > 0 ? await productRepository.findByIds(productIds) : [];
  const productMap = new Map(products.map((product) => [product._id.toString(), product]));

  const subtotal = items.reduce((sum, item) => {
    const productId = getItemProductId(item);
    const product = productMap.get(productId);
    const price = Number(product?.price ?? 0);
    return sum + price * Number(item.quantity || 0);
  }, 0);

  const promo = await getPromoIfValid(promoCode, subtotal);
  const discount = calculateDiscount(promo, subtotal);
  const shipping = items.length > 0 ? SHIPPING_FEE_EGP : 0;
  const total = Math.max(0, subtotal + shipping - discount);

  const lines = items.map((item) => {
    const productId = getItemProductId(item);
    const product = productMap.get(productId);
    const unitPrice = Number(product?.price ?? 0);
    const quantity = Number(item.quantity || 0);
    return {
      productId,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
      name: product?.name || "",
      image: Array.isArray(product?.images) ? product.images[0] || "" : "",
    };
  });

  return {
    user: userId,
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

const getCart = async (userId) => {
  const cart = await cartRepository.findByUserId(userId);
  if (!cart) {
    return buildCartResponse(userId, [], "");
  }

  const response = await buildCartResponse(userId, cart.items || [], cart.promoCode || "");
  if ((cart.promoCode || "") !== response.promoCode) {
    await cartRepository.upsertByUserId(userId, cart.items || [], response.promoCode);
  }
  return response;
};

const addItem = async (userId, productId, quantity = 1) => {
  if (quantity <= 0) throw new ApiError(400, "Quantity must be greater than 0");
  await ensureProductExists(productId);

  const cart = (await cartRepository.findRawByUserId(userId)) || { items: [], promoCode: "" };
  const existing = cart.items.find((item) => item.product.toString() === productId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({ product: productId, quantity });
  }

  await cartRepository.upsertByUserId(userId, cart.items, cart.promoCode || "");
  return getCart(userId);
};

const removeItem = async (userId, productId) => {
  const cart = (await cartRepository.findRawByUserId(userId)) || { items: [], promoCode: "" };
  const filtered = cart.items.filter((item) => item.product.toString() !== productId);
  await cartRepository.upsertByUserId(userId, filtered, cart.promoCode || "");
  return getCart(userId);
};

const updateItem = async (userId, productId, quantity) => {
  if (quantity < 0) throw new ApiError(400, "Quantity cannot be negative");

  const cart = (await cartRepository.findRawByUserId(userId)) || { items: [], promoCode: "" };
  const item = cart.items.find((entry) => entry.product.toString() === productId);

  if (!item) throw new ApiError(404, "Item not found in cart");

  if (quantity === 0) {
    cart.items = cart.items.filter((entry) => entry.product.toString() !== productId);
  } else {
    item.quantity = quantity;
  }

  await cartRepository.upsertByUserId(userId, cart.items, cart.promoCode || "");
  return getCart(userId);
};

const replaceItems = async (userId, lines) => {
  if (!Array.isArray(lines)) {
    throw new ApiError(400, "Lines must be an array");
  }

  const cart = (await cartRepository.findRawByUserId(userId)) || { items: [], promoCode: "" };
  const normalizedItems = [];
  for (const line of lines) {
    const productId = line?.productId;
    const quantity = Number(line?.quantity);
    if (!mongoose.isValidObjectId(productId)) {
      throw new ApiError(400, "Invalid product id");
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new ApiError(400, "Quantity must be greater than 0");
    }
    await ensureProductExists(productId);
    normalizedItems.push({ product: productId, quantity });
  }

  await cartRepository.upsertByUserId(userId, normalizedItems, cart.promoCode || "");
  return getCart(userId);
};

const applyPromoCode = async (userId, code) => {
  const normalized = normalizePromoCode(code);
  if (!normalized) throw new ApiError(400, "Promo code is required");

  const cart = (await cartRepository.findRawByUserId(userId)) || { items: [], promoCode: "" };
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

  const preview = await buildCartResponse(userId, cart.items, "");
  const subtotal = Number(preview.summary?.subtotal || 0);
  if (subtotal < Number(promo.minSubtotal || 0)) {
    rejectionReasons.push(
      `Minimum subtotal is EGP ${formatMoney(promo.minSubtotal)} (current: EGP ${formatMoney(subtotal)}).`
    );
  }

  const usedBefore = await Order.exists({
    user: userId,
    promoCode: normalized,
  });
  if (usedBefore) {
    rejectionReasons.push("You have already used this promo code before.");
  }

  if (rejectionReasons.length > 0) {
    throw new ApiError(400, rejectionReasons.join(" "));
  }

  await cartRepository.upsertByUserId(userId, cart.items, normalized);
  return getCart(userId);
};

const removePromoCode = async (userId) => {
  const cart = (await cartRepository.findRawByUserId(userId)) || { items: [], promoCode: "" };
  await cartRepository.upsertByUserId(userId, cart.items, "");
  return getCart(userId);
};

const clearCart = async (userId) => {
  await cartRepository.upsertByUserId(userId, [], "");
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
