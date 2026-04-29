const collectionRepository = require("../repositories/collectionRepository");
const ApiError = require("../utils/ApiError");
const { getCache, setCache, invalidatePattern } = require("../utils/cache");

const getCollections = async () => {
  const cacheKey = "collections:all";
  
  // Try to get from cache
  const cachedCollections = await getCache(cacheKey);
  if (cachedCollections) {
    return cachedCollections;
  }

  const collections = await collectionRepository.findAll();

  // Cache the result for 2 hours (collections change less frequently)
  await setCache(cacheKey, collections, 7200);

  return collections;
};

const getCollectionBySlug = async (slug) => {
  const cacheKey = `collections:slug:${slug}`;
  
  // Try to get from cache
  const cachedCollection = await getCache(cacheKey);
  if (cachedCollection) {
    return cachedCollection;
  }

  const collection = await collectionRepository.findBySlug(slug);
  if (!collection) throw new ApiError(404, "Collection not found");

  // Cache the result for 2 hours
  await setCache(cacheKey, collection, 7200);

  return collection;
};

module.exports = {
  getCollections,
  getCollectionBySlug,
};
