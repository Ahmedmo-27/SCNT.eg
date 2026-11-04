const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const PromotionCampaign = require("../src/models/PromotionCampaign");
const PromoCode = require("../src/models/PromoCode");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function connectDb() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI in environment.");
  }
  await mongoose.connect(mongoUri);
}

async function seedPromotions() {
  // 1. Ensure DEFAULT_WELCOME campaign exists for normal times
  const welcomeCampaign = await PromotionCampaign.findOneAndUpdate(
    { type: "DEFAULT_WELCOME" },
    {
      $set: {
        name: "First Order Welcome Discount",
        type: "DEFAULT_WELCOME",
        badge: { en: "Welcome Perk", ar: "هدية الترحيب" },
        title: { en: "Experience House of SCNT", ar: "اكتشف عالم SCNT العطري" },
        subtitle: {
          en: "Enjoy 10% off your first artisanal fragrance order.",
          ar: "احصل على خصم 10% على أول طلب لعطورنا المصنوعة بحرفية.",
        },
        description: {
          en: "Enter your email to receive your personal first-order discount code.",
          ar: "أدخل بريدك الإلكتروني لاستلام كود خصم طلبك الأول فوراً.",
        },
        discountHighlight: { en: "10% OFF FIRST ORDER", ar: "خصم 10% على طلبك الأول" },
        ctaText: { en: "Unlock My 10% Code", ar: "احصل على كود الخصم" },
        promoCode: "FIRST10",
        discountType: "PERCENTAGE",
        discountValue: 10,
        minSubtotal: 0,
        isActive: true,
        showModal: true,
        theme: "gold_luxury",
      },
    },
    { upsert: true, new: true }
  );

  // Sync PromoCode model
  await PromoCode.findOneAndUpdate(
    { code: "FIRST10" },
    {
      $set: {
        code: "FIRST10",
        discountType: "PERCENTAGE",
        discountValue: 10,
        minSubtotal: 0,
        isActive: true,
        discountScope: "WHOLE_CART",
      },
    },
    { upsert: true }
  );

  console.log(`Default Welcome campaign seeded: ${welcomeCampaign.name} (${welcomeCampaign.promoCode})`);
}

async function run() {
  try {
    await connectDb();
    await seedPromotions();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

run();
