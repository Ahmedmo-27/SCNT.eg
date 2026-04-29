const productRepository = require("../repositories/productRepository");
const ApiError = require("../utils/ApiError");
const Collection = require("../models/Collection");
const { escapeRegex, normalizeArabicSearchInput } = require("../utils/searchText");
const { getCache, setCache, invalidatePattern } = require("../utils/cache");

const buildProductFilters = async ({ collection, note, q, gender }) => {
  const and = [];

  if (collection) and.push({ SCNTcollection: collection });

  if (gender && ["male", "female"].includes(String(gender).toLowerCase())) {
    and.push({ gender: String(gender).toLowerCase() });
  }

  if (note && String(note).trim()) {
    const noteNorm = normalizeArabicSearchInput(String(note).trim());
    const safe = escapeRegex(noteNorm);
    and.push({
      $or: [
        { topNotes: { $regex: safe, $options: "i" } },
        { heartNotes: { $regex: safe, $options: "i" } },
        { baseNotes: { $regex: safe, $options: "i" } },
        { "translations.ar.topNotes": { $regex: safe, $options: "i" } },
        { "translations.ar.heartNotes": { $regex: safe, $options: "i" } },
        { "translations.ar.baseNotes": { $regex: safe, $options: "i" } },
      ],
    });
  }

  if (q && String(q).trim()) {
    const qNorm = normalizeArabicSearchInput(String(q).trim());
    const safe = escapeRegex(qNorm);
    const or = [
      { name: { $regex: safe, $options: "i" } },
      { slug: { $regex: safe, $options: "i" } },
      { inspired_from: { $regex: safe, $options: "i" } },
      { description: { $regex: safe, $options: "i" } },
      { topNotes: { $regex: safe, $options: "i" } },
      { heartNotes: { $regex: safe, $options: "i" } },
      { baseNotes: { $regex: safe, $options: "i" } },
      { "translations.ar.name": { $regex: safe, $options: "i" } },
      { "translations.ar.inspired_from": { $regex: safe, $options: "i" } },
      { "translations.ar.description": { $regex: safe, $options: "i" } },
      { "translations.ar.size": { $regex: safe, $options: "i" } },
      { "translations.ar.topNotes": { $regex: safe, $options: "i" } },
      { "translations.ar.heartNotes": { $regex: safe, $options: "i" } },
      { "translations.ar.baseNotes": { $regex: safe, $options: "i" } },
    ];

    const collectionOr = [
      { name: { $regex: safe, $options: "i" } },
      { slug: { $regex: safe, $options: "i" } },
      { tagline: { $regex: safe, $options: "i" } },
      { sub_tagline: { $regex: safe, $options: "i" } },
      { description: { $regex: safe, $options: "i" } },
      { "translations.ar.name": { $regex: safe, $options: "i" } },
      { "translations.ar.tagline": { $regex: safe, $options: "i" } },
      { "translations.ar.sub_tagline": { $regex: safe, $options: "i" } },
      { "translations.ar.description": { $regex: safe, $options: "i" } },
    ];

    const matchingCollectionIds = await Collection.find({ $or: collectionOr }).distinct("_id");
    if (matchingCollectionIds.length > 0) {
      or.push({ SCNTcollection: { $in: matchingCollectionIds } });
    }

    and.push({ $or: or });
  }

  if (and.length === 0) return {};
  if (and.length === 1) return and[0];
  return { $and: and };
};

const getProducts = async (query) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 12), 1), 100);
  const skip = (page - 1) * limit;

  // Generate cache key based on query parameters
  const cacheKey = `products:list:${JSON.stringify({ ...query, page, limit })}`;
  
  // Try to get from cache
  const cachedResult = await getCache(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  const filters = await buildProductFilters(query);

  const [items, total] = await Promise.all([
    productRepository.findProducts({ filters, skip, limit }),
    productRepository.countProducts(filters),
  ]);

  const result = {
    items,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };

  // Cache the result for 1 hour
  await setCache(cacheKey, result, 3600);

  return result;
};

const getProductBySlug = async (slug) => {
  const cacheKey = `products:slug:${slug}`;
  
  // Try to get from cache
  const cachedProduct = await getCache(cacheKey);
  if (cachedProduct) {
    return cachedProduct;
  }

  const product = await productRepository.findBySlug(slug);
  if (!product) throw new ApiError(404, "Product not found");

  // Cache the result for 1 hour
  await setCache(cacheKey, product, 3600);

  return product;
};

const createProduct = async (payload) => productRepository.createProduct(payload);

const updateProduct = async (id, payload) => {
  const updated = await productRepository.updateProduct(id, payload);
  if (!updated) throw new ApiError(404, "Product not found");

  // Invalidate product cache patterns when product is updated
  await invalidatePattern("products:*");

  return updated;
};

const deleteProduct = async (id) => {
  const deleted = await productRepository.deleteProduct(id);
  if (!deleted) throw new ApiError(404, "Product not found");

  // Invalidate product cache patterns when product is deleted
  await invalidatePattern("products:*");

  return deleted;
};

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
};
