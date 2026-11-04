const dotenv = require("dotenv");
const mongoose = require("mongoose");

const Collection = require("../src/models/Collection");
const { collections } = require("./collections.data");

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
}

async function run() {
  try {
    await connectDb();
    await upsertCollections();
    console.log(`Seeding complete: ${collections.length} collections upserted.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Collection seeding failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

run();
