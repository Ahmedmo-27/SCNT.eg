const Product = require("../models/Product");

const findProducts = ({ filters, skip, limit }) =>
  Product.find(filters).populate("collection").skip(skip).limit(limit).sort({ createdAt: -1 });

const countProducts = (filters) => Product.countDocuments(filters);

const findBySlug = (slug) => Product.findOne({ slug }).populate("collection");

const findById = (id) => Product.findById(id).populate("collection");

const findByIds = (ids) => Product.find({ _id: { $in: ids } });

const createProduct = (payload) => Product.create(payload);

const updateProduct = (id, payload) => Product.findByIdAndUpdate(id, payload, { new: true });

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
