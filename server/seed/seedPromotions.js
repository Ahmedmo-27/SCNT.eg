const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const PromotionCampaign = require("../src/models/PromotionCampaign");
const PromoCode = require("../src/models/PromoCode");
const { deleteCache } = require("../src/utils/cache");

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
  // Pre-submission text must NOT reveal the discount percentage.
  const welcomeCampaign = await PromotionCampaign.findOneAndUpdate(
    { type: "DEFAULT_WELCOME" },
    {
      $set: {
        name: "First Order Welcome Discount",
        type: "DEFAULT_WELCOME",
        badge: { en: "Welcome Perk", ar: "هدية الترحيب" },
        title: { en: "Experience House of SCNT", ar: "اكتشف عالم SCNT العطري" },
        subtitle: {
          en: "Enjoy an exclusive introductory discount on your first artisanal fragrance order.",
          ar: "احصل على خصم ترحيبي حصري على أول طلب لعطورنا المصنوعة بحرفية.",
        },
        description: {
          en: "Enter your email to receive your personal discount code directly in your inbox.",
          ar: "أدخل بريدك الإلكتروني لاستلام كود الخصم الخاص بك مباشرة عبر البريد.",
        },
        discountHighlight: {
          en: "EXCLUSIVE FIRST ORDER PRIVILEGE",
          ar: "ميزة حصرية على أول طلب",
        },
        ctaText: {
          en: "Unlock My Discount Code",
          ar: "احصل على كود الخصم",
        },
        promoCode: "FIRST10",
        discountType: "PERCENTAGE",
        discountValue: 10,
        minSubtotal: 0,
        isActive: true,
        showModal: true,
        theme: "scnt_signature",
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

  await deleteCache("promotions:active");
  console.log(`Default Welcome campaign updated: ${welcomeCampaign.name} (${welcomeCampaign.promoCode})`);
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
