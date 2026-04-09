const productRepository = require("../repositories/productRepository");
const ApiError = require("../utils/ApiError");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildProductFilters = ({ collection, note, q }) => {
  const and = [];

  if (collection) and.push({ collection });

  if (note && String(note).trim()) {
    const safe = escapeRegex(String(note).trim());
    and.push({
      $or: [
        { topNotes: { $regex: safe, $options: "i" } },
        { heartNotes: { $regex: safe, $options: "i" } },
        { baseNotes: { $regex: safe, $options: "i" } },
      ],
    });
  }

  if (q && String(q).trim()) {
    const safe = escapeRegex(String(q).trim());
    and.push({
      $or: [
        { name: { $regex: safe, $options: "i" } },
        { slug: { $regex: safe, $options: "i" } },
        { inspired_from: { $regex: safe, $options: "i" } },
        { description: { $regex: safe, $options: "i" } },
        { topNotes: { $regex: safe, $options: "i" } },
        { heartNotes: { $regex: safe, $options: "i" } },
        { baseNotes: { $regex: safe, $options: "i" } },
      ],
    });
  }

  if (and.length === 0) return {};
  if (and.length === 1) return and[0];
  return { $and: and };
};

const getProducts = async (query) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 12), 1), 100);
  const skip = (page - 1) * limit;
  const filters = buildProductFilters(query);

  const [items, total] = await Promise.all([
    productRepository.findProducts({ filters, skip, limit }),
    productRepository.countProducts(filters),
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
};

const getProductBySlug = async (slug) => {
  const product = await productRepository.findBySlug(slug);
  if (!product) throw new ApiError(404, "Product not found");
  return product;
};

const createProduct = async (payload) => productRepository.createProduct(payload);

const updateProduct = async (id, payload) => {
  const updated = await productRepository.updateProduct(id, payload);
  if (!updated) throw new ApiError(404, "Product not found");
  return updated;
};

const deleteProduct = async (id) => {
  const deleted = await productRepository.deleteProduct(id);
  if (!deleted) throw new ApiError(404, "Product not found");
  return deleted;
};

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
};
