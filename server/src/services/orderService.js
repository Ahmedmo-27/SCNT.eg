const orderRepository = require("../repositories/orderRepository");
const productRepository = require("../repositories/productRepository");
const cartRepository = require("../repositories/cartRepository");
const userRepository = require("../repositories/userRepository");
const PromoCode = require("../models/PromoCode");
const ApiError = require("../utils/ApiError");
const { sendOrderConfirmationEmail } = require("./emailService");

/** Flat COD shipping fee (EGP), aligned with checkout UI. */
const SHIPPING_FEE_EGP = 80;

const requiredAddressFields = ["fullName", "phone", "city", "addressLine1", "postalCode"];

const validateAddress = (address) => {
  if (!address) throw new ApiError(400, "Address is required");
  for (const field of requiredAddressFields) {
    if (!address[field]) {
      throw new ApiError(400, `Address field ${field} is required`);
    }
  }
};

const normalizePromoCode = (code = "") => String(code).trim().toUpperCase();

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

  return Math.min(Math.max(0, discount), subtotal);
};

const createOrderFromCart = async (userId, address) => {
  validateAddress(address);

  const user = await userRepository.findById(userId).select("email full_name");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const cart = await cartRepository.findRawByUserId(userId);
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  const productIds = cart.items.map((item) => item.product);
  const products = await productRepository.findByIds(productIds);
  const productMap = new Map(products.map((product) => [product._id.toString(), product]));

  const orderItems = [];
  const emailItems = [];
  let subtotal = 0;

  for (const item of cart.items) {
    const product = productMap.get(item.product.toString());
    if (!product) throw new ApiError(400, "Cart contains invalid product");
    if (product.stock < item.quantity) {
      throw new ApiError(400, `Insufficient stock for ${product.name}`);
    }

    const unitPrice = Number(product.price);
    const quantity = Number(item.quantity);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new ApiError(400, `Invalid price for ${product.name}`);
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new ApiError(400, `Invalid quantity for ${product.name}`);
    }

    orderItems.push({
      product: product._id,
      quantity,
      price: unitPrice,
    });
    emailItems.push({
      name: product.name,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    });
    subtotal += unitPrice * quantity;
  }

  for (const item of cart.items) {
    await productRepository.updateProduct(item.product, { $inc: { stock: -item.quantity } });
  }

  const promo = await getPromoIfValid(cart.promoCode, subtotal);
  const discount = calculateDiscount(promo, subtotal);
  const total = Math.max(0, subtotal + SHIPPING_FEE_EGP - discount);

  const order = await orderRepository.createOrder({
    user: userId,
    items: orderItems,
    subtotal,
    shipping: SHIPPING_FEE_EGP,
    discount,
    promoCode: promo?.code || "",
    total,
    address,
  });
  await cartRepository.upsertByUserId(userId, [], "");

  sendOrderConfirmationEmail({
    to: user.email,
    customerName: user.full_name,
    orderNumber: order._id,
    orderDate: order.createdAt || new Date(),
    items: emailItems,
    subtotal: order.subtotal,
    shipping: order.shipping,
    discount: order.discount,
    total: order.total,
    shippingAddress: order.address,
  }).catch((error) => {
    console.error("Failed to send order confirmation email:", error.message);
  });

  return order;
};

const getMyOrders = (userId) => orderRepository.findByUserId(userId);

const getOrderById = async (id, currentUser) => {
  const order = await orderRepository.findById(id);
  if (!order) throw new ApiError(404, "Order not found");

  const isAdmin = currentUser.role === "admin";
  const isOwner = isAdmin ? true : await orderRepository.userHasOrder(currentUser.userId, order._id);
  if (!isOwner && !isAdmin) throw new ApiError(403, "Not authorized");

  return order;
};

const getAllOrders = () => orderRepository.findAll();

const updateOrderStatus = async (id, status) => {
  const allowed = ["PENDING", "CONFIRMED", "PAID", "SHIPPED"];
  if (!allowed.includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  const order = await orderRepository.updateStatus(id, status);
  if (!order) throw new ApiError(404, "Order not found");
  return order;
};

module.exports = {
  createOrderFromCart,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};
