const mongoose = require("mongoose");

const arCollectionFields = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    tagline: { type: String, default: "" },
    sub_tagline: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const collectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    themeColor: { type: String, default: "" },
    tagline: { type: String, default: "" },
    sub_tagline: { type: String, default: "" },
    description: { type: String, default: "" },
    translations: {
      ar: { type: arCollectionFields, default: () => ({}) },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Collection", collectionSchema);
