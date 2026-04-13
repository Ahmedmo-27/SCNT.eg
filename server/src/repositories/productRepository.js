const Product = require("../models/Product");

/** API bodies still use `collection`; BSON field is `SCNTcollection`. */
function normalizeProductWritePayload(payload) {
  if (!payload || typeof payload !== "object") return payload;
  if (Object.keys(payload).some((k) => k.startsWith("$"))) return payload;
  if (payload.collection == null) return payload;
  const next = { ...payload };
  next.SCNTcollection = next.collection;
  delete next.collection;
  return next;
}

const findProducts = ({ filters, skip, limit }) =>
  Product.find(filters).populate("SCNTcollection").skip(skip).limit(limit).sort({ createdAt: -1 });

const countProducts = (filters) => Product.countDocuments(filters);

const findBySlug = (slug) => Product.findOne({ slug }).populate("SCNTcollection");

const findById = (id) => Product.findById(id).populate("SCNTcollection");

const findByIds = (ids) => Product.find({ _id: { $in: ids } });

const createProduct = (payload) => Product.create(normalizeProductWritePayload(payload));

const updateProduct = (id, payload) =>
  Product.findByIdAndUpdate(id, normalizeProductWritePayload(payload), { new: true });

const deleteProduct = (id) => Product.findByIdAndDelete(id);

module.exports = {
  findProducts,
  countProducts,
  findBySlug,
  findById,
  findByIds,
  createProduct,
  updateProduct,
  deleteProduct,
};
