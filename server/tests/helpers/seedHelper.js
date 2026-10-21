const Collection = require("../../src/models/Collection");
const Product = require("../../src/models/Product");

/**
 * Creates or retrieves a test collection in the test database.
 * Defaults to unique randomized slug to prevent unique index collisions.
 */
async function seedTestCollection(overrides = {}) {
  const slug =
    overrides.slug ||
    `test-col-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  let col = null;
  if (overrides.slug) {
    col = await Collection.findOne({ slug });
  }

  if (!col) {
    col = await Collection.create({
      name: overrides.name || `Test Collection ${Date.now()}`,
      slug,
      tagline: "Exclusive test scents",
      sub_tagline: "Finely crafted for automated test runs",
      description: "Collection specifically maintained for backend tests.",
      themeColor: "#1a1a1a",
      coverImage: "https://scnt-eg.me/images/collections/test-collection-cover.webp",
      clearBackground_Image: "https://scnt-eg.me/images/collections/test-collection-clear.webp",
      ...overrides,
    });
  }

  // Ensure collectionId string property is available on doc
  col.collectionId = col._id.toString();
  return col;
}

/**
 * Creates and persists a valid product document with customizable overrides.
 */
async function seedTestProduct(overrides = {}) {
  let collectionId = overrides.collection || overrides.SCNTcollection;
  if (!collectionId) {
    const col = await seedTestCollection();
    collectionId = col._id;
  }

  const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const defaultName = `Seed Fragrance ${uniqueSuffix}`;
  const defaultSlug = `seed-fragrance-${uniqueSuffix}`;
  const defaultInspired = `Seed Inspiration ${uniqueSuffix}`;

  const productPayload = {
    name: overrides.name || defaultName,
    slug: overrides.slug || defaultSlug,
    inspired_from: overrides.inspired_from || defaultInspired,
    SCNTcollection: collectionId,
    gender: overrides.gender || "male",
    price: overrides.price !== undefined ? overrides.price : 750,
    size: overrides.size || "100ml",
    sizes: overrides.sizes || [
      { size: "50ml", price: 500, stock: 20 },
      { size: "100ml", price: 750, stock: 40 },
    ],
    stock: overrides.stock !== undefined ? overrides.stock : 60,
    images: overrides.images || [
      "https://scnt-eg.me/images/products/seed-front.webp",
      "https://scnt-eg.me/images/products/seed-back.webp",
    ],
    clearBackground_Image: overrides.clearBackground_Image || "https://scnt-eg.me/images/products/seed-clear.webp",
    topNotes: overrides.topNotes || ["Bergamot", "Cardamom"],
    heartNotes: overrides.heartNotes || ["Lavender", "Iris"],
    baseNotes: overrides.baseNotes || ["Amber", "Cedarwood"],
    description: overrides.description || "Seed fragrance document for automated testing.",
    rating: overrides.rating !== undefined ? overrides.rating : 0,
    reviews: overrides.reviews || [],
  };

  // Merge remaining overrides
  const finalPayload = { ...productPayload, ...overrides };
  if (finalPayload.collection) {
    finalPayload.SCNTcollection = finalPayload.collection;
    delete finalPayload.collection;
  }

  const product = await Product.create(finalPayload);
  return product;
}

/**
 * Wipes test documents from products, reviews, and collections in scnt-eg-test.
 */
async function cleanTestCollections() {
  await Product.deleteMany({});
  await Collection.deleteMany({});

  try {
    const Review = require("../../src/models/Review");
    await Review.deleteMany({});
  } catch (_) {}

  try {
    const Cart = require("../../src/models/Cart");
    await Cart.deleteMany({});
  } catch (_) {}

  try {
    const Order = require("../../src/models/Order");
    await Order.deleteMany({});
  } catch (_) {}

  try {
    const PromoCode = require("../../src/models/PromoCode");
    await PromoCode.deleteMany({});
  } catch (_) {}
}

module.exports = {
  seedTestCollection,
  seedTestProduct,
  cleanTestCollections,
};
