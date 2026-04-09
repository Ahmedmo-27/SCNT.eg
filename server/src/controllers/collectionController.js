const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const collectionService = require("../services/collectionService");

const getCollections = asyncHandler(async (req, res) => {
  const result = await collectionService.getCollections();
  res.status(200).json(successResponse(result));
});

const getCollectionBySlug = asyncHandler(async (req, res) => {
  const result = await collectionService.getCollectionBySlug(req.params.slug);
  res.status(200).json(successResponse(result));
});

module.exports = {
  getCollections,
  getCollectionBySlug,
};
