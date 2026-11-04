const dotenv = require("dotenv");
const mongoose = require("mongoose");

const Collection = require("../src/models/Collection");
const Product = require("../src/models/Product");
const { collections } = require("./collections.data");
const { products } = require("./products.data");

dotenv.config();

async function connectDb() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI in environment.");
  }
  await mongoose.connect(mongoUri);
}

async function upsertCollections() {
  for (const collection of collections) {
    await Collection.updateOne(
      { slug: collection.slug },
      {
        $set: {
          ...collection,
        },
      },
      { upsert: true }
    );
  }

  const dbCollections = await Collection.find({ slug: { $in: collections.map((c) => c.slug) } }).select(
    "_id slug"
  );

  return new Map(dbCollections.map((c) => [c.slug, c._id]));
}

async function upsertProducts(collectionIdBySlug) {
  const femaleSlugs = new Set(["golden-bloom", "lumiere"]);

  for (const product of products) {
    const collectionId = collectionIdBySlug.get(product.collectionSlug);
    if (!collectionId) {
      throw new Error(`Collection not found for slug: ${product.collectionSlug}`);
    }

    await Product.updateOne(
      { slug: product.slug },
      {
        $set: {
          ...product,
          gender: femaleSlugs.has(product.slug) ? "female" : "male",
          SCNTcollection: collectionId,
        },
      },
      { upsert: true }
    );
  }
}

async function run() {
  try {
    await connectDb();
    const collectionIdBySlug = await upsertCollections();
    await upsertProducts(collectionIdBySlug);
    console.log(`Seeding complete: ${collections.length} collections, ${products.length} products upserted.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

run();
