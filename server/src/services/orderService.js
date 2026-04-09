const orderRepository = require("../repositories/orderRepository");
const productRepository = require("../repositories/productRepository");
const cartRepository = require("../repositories/cartRepository");
const ApiError = require("../utils/ApiError");

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

const createOrderFromCart = async (userId, address) => {
  validateAddress(address);

  const cart = await cartRepository.findRawByUserId(userId);
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  const productIds = cart.items.map((item) => item.product);
  const products = await productRepository.findByIds(productIds);
  const productMap = new Map(products.map((product) => [product._id.toString(), product]));

  const orderItems = [];
  let total = 0;

  for (const item of cart.items) {
    const product = productMap.get(item.product.toString());
    if (!product) throw new ApiError(400, "Cart contains invalid product");
    if (product.stock < item.quantity) {
      throw new ApiError(400, `Insufficient stock for ${product.name}`);
    }

    orderItems.push({
      product: product._id,
      quantity: item.quantity,
      price: product.price,
    });
    total += product.price * item.quantity;
  }

  for (const item of cart.items) {
    await productRepository.updateProduct(item.product, { $inc: { stock: -item.quantity } });
  }

  const order = await orderRepository.createOrder({
    user: userId,
    items: orderItems,
    total: total + SHIPPING_FEE_EGP,
    address,
  });
  await cartRepository.upsertByUserId(userId, []);
  return order;
};

const getMyOrders = (userId) => orderRepository.findByUserId(userId);

const getOrderById = async (id, currentUser) => {
  const order = await orderRepository.findById(id);
  if (!order) throw new ApiError(404, "Order not found");

  const isOwner = order.user._id.toString() === currentUser.userId;
  const isAdmin = currentUser.role === "admin";
  if (!isOwner && !isAdmin) throw new ApiError(403, "Not authorized");

  return order;
};

const getAllOrders = () => orderRepository.findAll();

const updateOrderStatus = async (id, status) => {
  const allowed = ["PENDING", "PAID", "SHIPPED"];
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
