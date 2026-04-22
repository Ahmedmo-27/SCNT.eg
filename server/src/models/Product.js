const mongoose = require("mongoose");

const arProductFields = new mongoose.Schema(
  {
    /** Arabic-script phonetic form of English `name` (not semantic translation). */
    name: { type: String, default: "" },
    inspired_from: { type: String, default: "" },
    description: { type: String, default: "" },
    size: { type: String, default: "" },
    topNotes: [{ type: String }],
    heartNotes: [{ type: String }],
    baseNotes: [{ type: String }],
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    inspired_from: { type: String, required: true, unique: true, trim: true },
    gender: {
      type: String,
      enum: ["male", "female"],
      default: "male",
      index: true,
    },
    SCNTcollection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
      required: true,
      index: true,
    },
    price: { type: Number, required: true, min: 0 },
    size: { type: String, default: "100ml" },
    images: [{ type: String }],
    coverImage: { type: String, default: "" },
    clearBackground_Image: { type: String, default: "" },
    topNotes: [{ type: String }],
    heartNotes: [{ type: String }],
    baseNotes: [{ type: String }],
    description: { type: String, default: "" },
    stock: { type: Number, default: 0, min: 0 },
    translations: {
      ar: { type: arProductFields, default: () => ({}) },
    },
  },
  { timestamps: true }
);

/** Expose populated ref as `collection` in JSON so the public API shape stays the same. */
function mapScntCollectionForApi(ret) {
  if (Object.prototype.hasOwnProperty.call(ret, "SCNTcollection")) {
    ret.collection = ret.SCNTcollection;
    delete ret.SCNTcollection;
  }
  return ret;
}

productSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    return mapScntCollectionForApi(ret);
  },
});

productSchema.set("toObject", {
  virtuals: true,
  transform(_doc, ret) {
    return mapScntCollectionForApi(ret);
  },
});

module.exports = mongoose.model("Product", productSchema);
