const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    inspired_from: { type: String, required: true, unique: true, trim: true },
    collection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
      required: true,
      index: true,
    },
    price: { type: Number, required: true, min: 0 },
    size: { type: String, default: "100ml" },
    images: [{ type: String }],
    topNotes: [{ type: String }],
    heartNotes: [{ type: String }],
    baseNotes: [{ type: String }],
    description: { type: String, default: "" },
    stock: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
