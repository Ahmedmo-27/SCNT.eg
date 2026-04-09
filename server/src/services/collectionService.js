const collectionRepository = require("../repositories/collectionRepository");
const ApiError = require("../utils/ApiError");

const getCollections = () => collectionRepository.findAll();

const getCollectionBySlug = async (slug) => {
  const collection = await collectionRepository.findBySlug(slug);
  if (!collection) throw new ApiError(404, "Collection not found");
  return collection;
};

module.exports = {
  getCollections,
  getCollectionBySlug,
};
