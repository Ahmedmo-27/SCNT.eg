const PromoCode = require("../models/PromoCode");

const normalizePromoCode = (code = "") => String(code || "").trim().toUpperCase();

const getItemProductId = (item) => {
  const raw = item?.product;
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw._id) return raw._id.toString();
  return raw.toString();
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

/**
 * Checks if a promo code has specific product restrictions.
 */
const hasProductRestrictions = (promo) => {
  return Array.isArray(promo?.applicableProducts) && promo.applicableProducts.length > 0;
};

/**
 * Computes the eligible subtotal for a given promo code.
 * If promo has no applicable products specified, the entire subtotal is eligible.
 * If promo restricts products and counts:
 * - Only items matching applicableProducts are considered.
 * - Units are capped at each product's maxCount (higher-priced units prioritized).
 */
const calculateEligibleSubtotal = (promo, items = [], productMap = new Map()) => {
  if (!hasProductRestrictions(promo)) {
    return items.reduce((sum, item) => {
      const pid = getItemProductId(item);
      const product = productMap.get(pid);
      const price = item.price != null ? Number(item.price) : getProductPriceForSize(product, item.size);
      return sum + price * Number(item.quantity || 0);
    }, 0);
  }

  // Build rule map: productId -> maxCount (null/undefined or <= 0 means unlimited)
  const ruleMap = new Map();
  for (const rule of promo.applicableProducts) {
    const rawPid = rule.product?._id || rule.product || rule.productId;
    if (rawPid) {
      const pid = rawPid.toString();
      const count = rule.maxCount != null ? Number(rule.maxCount) : null;
      ruleMap.set(pid, Number.isFinite(count) && count > 0 ? count : Infinity);
    }
  }

  // Expand matching items into individual units grouped by product
  const unitsByProduct = new Map();
  for (const item of items) {
    const pid = getItemProductId(item);
    if (!ruleMap.has(pid)) continue;

    const product = productMap.get(pid);
    const unitPrice = item.price != null ? Number(item.price) : getProductPriceForSize(product, item.size);
    const qty = Number(item.quantity || 0);

    if (!unitsByProduct.has(pid)) {
      unitsByProduct.set(pid, []);
    }
    const unitList = unitsByProduct.get(pid);
    for (let i = 0; i < qty; i++) {
      unitList.push(unitPrice);
    }
  }

  // For each product, sort units descending by price and take up to maxCount
  let eligibleSubtotal = 0;
  for (const [pid, units] of unitsByProduct.entries()) {
    const maxCount = ruleMap.get(pid) ?? Infinity;
    units.sort((a, b) => b - a);
    const selectedUnits = units.slice(0, maxCount);
    for (const p of selectedUnits) {
      eligibleSubtotal += p;
    }
  }

  return eligibleSubtotal;
};

/**
 * Checks whether the cart has at least one item eligible for the promo.
 */
const isPromoApplicableToCart = (promo, items = []) => {
  if (!hasProductRestrictions(promo)) return true;
  if (!Array.isArray(items) || items.length === 0) return false;

  const ruleIds = new Set(
    promo.applicableProducts
      .map((r) => (r.product?._id || r.product || r.productId)?.toString())
      .filter(Boolean)
  );

  return items.some((item) => {
    const pid = getItemProductId(item);
    return ruleIds.has(pid) && Number(item.quantity || 0) > 0;
  });
};

/**
 * Retrieves promo code if active, non-expired, meets minSubtotal,
 * and matches cart items (if product restrictions exist).
 */
const getPromoIfValid = async (promoCode, subtotal, items = []) => {
  const normalized = normalizePromoCode(promoCode);
  if (!normalized) return null;

  const promo = await PromoCode.findOne({ code: normalized, isActive: true });
  if (!promo) return null;

  const now = Date.now();
  if (promo.startsAt && new Date(promo.startsAt).getTime() > now) return null;
  if (promo.expiresAt && new Date(promo.expiresAt).getTime() < now) return null;
  if (subtotal < Number(promo.minSubtotal || 0)) return null;

  if (hasProductRestrictions(promo) && !isPromoApplicableToCart(promo, items)) {
    return null;
  }

  return promo;
};

/**
 * Calculates discount amount considering product restrictions, counts, and caps.
 */
const calculateDiscount = (promo, subtotal, items = [], productMap = new Map()) => {
  if (!promo || subtotal <= 0) return 0;

  const eligibleSubtotal = calculateEligibleSubtotal(promo, items, productMap);
  if (eligibleSubtotal <= 0) return 0;

  let discount = 0;
  if (promo.discountType === "PERCENTAGE") {
    discount = (eligibleSubtotal * Number(promo.discountValue || 0)) / 100;
  } else {
    discount = Math.min(Number(promo.discountValue || 0), eligibleSubtotal);
  }

  const maxDiscount = promo.maxDiscount == null ? null : Number(promo.maxDiscount);
  if (maxDiscount != null && Number.isFinite(maxDiscount)) {
    discount = Math.min(discount, maxDiscount);
  }

  discount = Math.max(0, discount);
  return Math.min(discount, subtotal);
};

module.exports = {
  normalizePromoCode,
  getItemProductId,
  getProductPriceForSize,
  hasProductRestrictions,
  calculateEligibleSubtotal,
  isPromoApplicableToCart,
  getPromoIfValid,
  calculateDiscount,
};
