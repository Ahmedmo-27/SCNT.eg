const dotenv = require("dotenv");
const mongoose = require("mongoose");

const PromoCode = require("../src/models/PromoCode");

dotenv.config();

async function connectDb() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI in environment.");
  }
  await mongoose.connect(mongoUri);
}

async function upsertPromoCodes() {
  const promoCodes = [
    {
      code: "HELLO_123",
      discountType: "PERCENTAGE",
      discountValue: 20,
      minSubtotal: 1500,
      isActive: true,
    },
    {
      code: "REVIEW20",
      discountType: "PERCENTAGE",
      discountValue: 20,
      minSubtotal: 0,
      isActive: true,
    },
  ];

  for (const promo of promoCodes) {
    await PromoCode.updateOne(
      { code: promo.code },
      {
        $set: {
          code: promo.code,
          discountType: promo.discountType,
          discountValue: promo.discountValue,
          minSubtotal: promo.minSubtotal,
          isActive: promo.isActive,
        },
      },
      { upsert: true }
    );
  }

  return promoCodes.length;
}

async function run() {
  try {
    await connectDb();
    const count = await upsertPromoCodes();
    console.log(`Promo code seeding complete: ${count} promo code(s) upserted.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Promo code seeding failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

run();
