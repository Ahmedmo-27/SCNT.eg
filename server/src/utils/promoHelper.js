const PromoCode = require("../models/PromoCode");

const normalizePromoCode = (code = "") => String(code || "").trim().toUpperCase();

const normalizeSize = (size = "") => String(size || "").toLowerCase().replace(/\s+/g, "");

const matchesSizes = (itemSize, allowedSizes) => {
  if (!Array.isArray(allowedSizes) || allowedSizes.length === 0) return true;
  const normItem = normalizeSize(itemSize);
  return allowedSizes.some((s) => normalizeSize(s) === normItem);
};

const getItemProductId = (item) => {
  const raw = item?.product;
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw._id) return raw._id.toString();
  return raw.toString();
};

const getProductPriceForSize = (product, size) => {
  const normSize = normalizeSize(size);
  if (normSize === "50ml") {
    const opt = product?.sizes?.find(
      (s) => normalizeSize(s.size) === "50ml"
    );
    return opt ? Number(opt.price) : 500;
  }
  const opt = product?.sizes?.find(
    (s) => normalizeSize(s.size) === "100ml"
  );
  return opt ? Number(opt.price) : Number(product?.price || 750);
};

/**
 * Checks if a promo code has specific product or size restrictions.
 */
const hasProductRestrictions = (promo) => {
  const hasProducts = Array.isArray(promo?.applicableProducts) && promo.applicableProducts.length > 0;
  const hasSizes = Array.isArray(promo?.applicableSizes) && promo.applicableSizes.length > 0;
  return hasProducts || hasSizes;
};

/**
 * Checks whether a single cart item matches the promo's product and size constraints.
 */
const isItemEligible = (promo, item) => {
  const itemSize = item.size || "100ml";

  // Check promo-level size restrictions (e.g. 50ml only storewide)
  if (!matchesSizes(itemSize, promo.applicableSizes)) {
    return false;
  }

  // Check product-level rules
  if (Array.isArray(promo.applicableProducts) && promo.applicableProducts.length > 0) {
    const pid = getItemProductId(item);
    const rule = promo.applicableProducts.find(
      (r) => (r.product?._id || r.product || r.productId)?.toString() === pid
    );
    if (!rule) return false;

    // Check product rule size restrictions (e.g. Azure Code 100ml only)
    if (!matchesSizes(itemSize, rule.sizes)) {
      return false;
    }
  }

  return true;
};

/**
 * Checks whether the cart has at least one item eligible for the promo.
 */
const isPromoApplicableToCart = (promo, items = []) => {
  if (!hasProductRestrictions(promo)) return true;
  if (!Array.isArray(items) || items.length === 0) return false;

  return items.some((item) => isItemEligible(promo, item) && Number(item.quantity || 0) > 0);
};

/**
 * Computes the eligible subtotal for a given promo code.
 * - If promo has no restrictions, the entire subtotal is eligible.
 * - If discountScope is "WHOLE_CART", the entire cart subtotal is eligible as long as
 *   at least one required item/size is present.
 * - If discountScope is "CERTAIN_PRODUCTS" (default):
 *   Only eligible items and quantities (up to maxCount) contribute to the eligible subtotal.
 */
const calculateEligibleSubtotal = (promo, items = [], productMap = new Map()) => {
  const totalSubtotal = items.reduce((sum, item) => {
    const pid = getItemProductId(item);
    const product = productMap.get(pid);
    const price = item.price != null ? Number(item.price) : getProductPriceForSize(product, item.size);
    return sum + price * Number(item.quantity || 0);
  }, 0);

  if (!hasProductRestrictions(promo)) {
    return totalSubtotal;
  }

  // If the discount is configured to apply to the whole cart when eligible items are present:
  if (promo.discountScope === "WHOLE_CART") {
    return isPromoApplicableToCart(promo, items) ? totalSubtotal : 0;
  }

  // Specific products/sizes only
  const hasProducts = Array.isArray(promo.applicableProducts) && promo.applicableProducts.length > 0;
  const ruleMap = new Map();
  if (hasProducts) {
    for (const rule of promo.applicableProducts) {
      const rawPid = rule.product?._id || rule.product || rule.productId;
      if (rawPid) {
        const pid = rawPid.toString();
        const count = rule.maxCount != null ? Number(rule.maxCount) : null;
        ruleMap.set(pid, {
          maxCount: Number.isFinite(count) && count > 0 ? count : Infinity,
          sizes: Array.isArray(rule.sizes) ? rule.sizes : [],
        });
      }
    }
  }

  // Group eligible units by product (or single pool if size-only restriction)
  const unitsByProduct = new Map();
  for (const item of items) {
    if (!isItemEligible(promo, item)) continue;

    const pid = getItemProductId(item);
    const product = productMap.get(pid);
    const unitPrice = item.price != null ? Number(item.price) : getProductPriceForSize(product, item.size);
    const qty = Number(item.quantity || 0);

    const groupKey = hasProducts ? pid : "__all__";
    if (!unitsByProduct.has(groupKey)) {
      unitsByProduct.set(groupKey, []);
    }
    const unitList = unitsByProduct.get(groupKey);
    for (let i = 0; i < qty; i++) {
      unitList.push(unitPrice);
    }
  }

  // For each product, sort units descending by price and take up to maxCount
  let eligibleSubtotal = 0;
  for (const [groupKey, units] of unitsByProduct.entries()) {
    const maxCount = hasProducts ? (ruleMap.get(groupKey)?.maxCount ?? Infinity) : Infinity;
    units.sort((a, b) => b - a);
    const selectedUnits = units.slice(0, maxCount);
    for (const p of selectedUnits) {
      eligibleSubtotal += p;
    }
  }

  return eligibleSubtotal;
};

/**
 * Retrieves promo code if active, non-expired, meets minSubtotal,
 * and matches cart items (if product/size restrictions exist).
 */
const getPromoIfValid = async (promoCode, subtotal, items = []) => {
  const normalized = normalizePromoCode(promoCode);
  if (!normalized) return null;

  const promo = await PromoCode.findOne({ code: normalized, isActive: true });
  if (!promo) return null;

  const now = Date.now();
  if (promo.startsAt && new Date(promo.startsAt).getTime() > now + 60000) return null;
  if (promo.expiresAt && new Date(promo.expiresAt).getTime() < now) return null;
  if (subtotal < Number(promo.minSubtotal || 0)) return null;

  if (hasProductRestrictions(promo) && !isPromoApplicableToCart(promo, items)) {
    return null;
  }

  return promo;
};

/**
 * Calculates discount amount considering product/size restrictions, counts, scopes, and caps.
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
  normalizeSize,
  matchesSizes,
  getItemProductId,
  getProductPriceForSize,
  hasProductRestrictions,
  isItemEligible,
  isPromoApplicableToCart,
  calculateEligibleSubtotal,
  getPromoIfValid,
  calculateDiscount,
};
