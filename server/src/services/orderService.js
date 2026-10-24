const orderRepository = require("../repositories/orderRepository");
const productRepository = require("../repositories/productRepository");
const cartRepository = require("../repositories/cartRepository");
const userRepository = require("../repositories/userRepository");
const PromoCode = require("../models/PromoCode");
const Visit = require("../models/Visit");
const ApiError = require("../utils/ApiError");
const { sendOrderConfirmationEmail } = require("./emailService");
const { deleteCache } = require("../utils/cache");
const {
  normalizePromoCode,
  getProductPriceForSize,
  getPromoIfValid,
  calculateDiscount,
} = require("../utils/promoHelper");

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

const normalizeOrderOwner = (ownerArg) => {
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
  throw new ApiError(400, "Missing user or visitor identifier for order");
};

const createOrderFromCart = async (ownerArg, address, customerEmail = "") => {
  validateAddress(address);

  const owner = normalizeOrderOwner(ownerArg);
  if (!owner.userId) {
    throw new ApiError(401, "An account is required to place an order. Please register or log in.");
  }

  const user = await userRepository.findById(owner.userId).select("email full_name");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const customerName = user.full_name || address.fullName;
  const recipientEmail = user.email || String(customerEmail || address.email || "").trim();

  let cart = await cartRepository.findRawByUserId(owner.userId);
  if ((!cart || cart.items.length === 0) && owner.visitorId) {
    await cartRepository.mergeGuestCartIntoUserCart(owner.visitorId, owner.userId);
    cart = await cartRepository.findRawByUserId(owner.userId);
  }

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

    const itemSize = item.size || "100ml";
    const unitPrice = getProductPriceForSize(product, itemSize);
    const quantity = Number(item.quantity);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new ApiError(400, `Invalid price for ${product.name}`);
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new ApiError(400, `Invalid quantity for ${product.name}`);
    }

    orderItems.push({
      product: product._id,
      size: itemSize,
      quantity,
      price: unitPrice,
    });
    emailItems.push({
      name: `${product.name} (${itemSize})`,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    });
    subtotal += unitPrice * quantity;
  }

  for (const item of cart.items) {
    await productRepository.updateProduct(item.product, { $inc: { stock: -item.quantity } });
  }

  const promo = await getPromoIfValid(cart.promoCode, subtotal, cart.items);
  const discount = calculateDiscount(promo, subtotal, cart.items, productMap);
  const total = Math.max(0, subtotal + SHIPPING_FEE_EGP - discount);

  const orderPayload = {
    user: owner.userId,
    isGuest: false,
    visitorId: owner.visitorId || null,
    customerEmail: recipientEmail,
    customerPhone: address.phone,
    items: orderItems,
    subtotal,
    shipping: SHIPPING_FEE_EGP,
    discount,
    promoCode: promo?.code || "",
    total,
    address,
  };

  const order = await orderRepository.createOrder(orderPayload);

  await cartRepository.upsertByUserId(owner.userId, [], "");
  await deleteCache(`cart:user:${owner.userId}`);
  if (owner.visitorId) {
    await cartRepository.upsertByOwner({ visitorId: owner.visitorId }, [], "");
    await deleteCache(`cart:guest:${owner.visitorId}`);
  }

  // Track order completion milestone for buying funnel analytics
  Visit.create({
    visitorId: owner.visitorId || cart.visitorId || (owner.userId ? `user_${owner.userId}` : "guest"),
    sessionId: owner.sessionId || cart.sessionId || `session_${order._id}`,
    path: `/order-confirmation/${order._id}`,
    title: "Order Placed",
    userId: owner.userId || null,
    stage: "order_placed",
    action: "order_placed",
    metadata: {
      orderId: order._id.toString(),
      total: order.total,
      promoCode: order.promoCode,
      itemCount: order.items.length,
      isGuest: !owner.userId,
    },
  }).catch(() => {});

  if (recipientEmail) {
    sendOrderConfirmationEmail({
      to: recipientEmail,
      customerName,
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
  }

  return order;
};

const getMyOrders = (userId) => orderRepository.findByUserId(userId);

const getOrderById = async (id, currentUser, visitorId = null) => {
  const order = await orderRepository.findById(id);
  if (!order) throw new ApiError(404, "Order not found");

  const isAdmin = currentUser?.role === "admin";
  if (isAdmin) return order;

  if (currentUser?.userId) {
    const isOwner = await orderRepository.userHasOrder(currentUser.userId, order._id);
    if (isOwner) return order;
  }

  if (order.isGuest && visitorId && order.visitorId === String(visitorId).trim()) {
    return order;
  }

  throw new ApiError(403, "Not authorized");
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
