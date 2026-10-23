const mongoose = require("mongoose");

const offlineSaleItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    size: { type: String, default: "100ml" },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const offlineCustomerSchema = new mongoose.Schema(
  {
    fullName: { type: String, default: "Walk-in Customer", trim: true },
    phone: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const offlineSaleSchema = new mongoose.Schema(
  {
    receiptNumber: { type: String, required: true, unique: true, index: true },
    items: { type: [offlineSaleItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["CASH", "INSTAPAY", "CARD", "VODAFONE_CASH", "BANK_TRANSFER", "OTHER"],
      default: "CASH",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PAID", "PARTIALLY_PAID", "PENDING"],
      default: "PAID",
      index: true,
    },
    channel: {
      type: String,
      enum: ["WALK_IN", "BAZAAR", "POPUP_BOOTH", "WHATSAPP", "PHONE", "INSTAGRAM", "EXHIBITION", "OTHER"],
      default: "WALK_IN",
      index: true,
    },
    location: { type: String, default: "", trim: true },
    customer: { type: offlineCustomerSchema, default: () => ({ fullName: "Walk-in Customer", phone: "", email: "" }) },
    notes: { type: String, default: "", trim: true },
    saleDate: { type: Date, default: Date.now, index: true },
    deductedStock: { type: Boolean, default: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

offlineSaleSchema.index({ createdAt: -1 });
offlineSaleSchema.index({ saleDate: -1 });

module.exports = mongoose.model("OfflineSale", offlineSaleSchema);
