const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const productService = require("../services/productService");

const getProducts = asyncHandler(async (req, res) => {
  const result = await productService.getProducts(req.query);
  res.status(200).json(successResponse(result));
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const result = await productService.getProductBySlug(req.params.slug);
  res.status(200).json(successResponse(result));
});

const createProduct = asyncHandler(async (req, res) => {
  const result = await productService.createProduct(req.body);
  res.status(201).json(successResponse(result, "Product created"));
});

const updateProduct = asyncHandler(async (req, res) => {
  const result = await productService.updateProduct(req.params.id, req.body);
  res.status(200).json(successResponse(result, "Product updated"));
});

const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id);
  res.status(200).json(successResponse(null, "Product deleted"));
});

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
};
