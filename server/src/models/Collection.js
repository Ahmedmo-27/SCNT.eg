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
    /** Public URL or site path for collection cards / hero artwork. */
    coverImage: { type: String, default: "" },
    /** Public URL or site path for the collection artwork image. */
    artwork: { type: String, default: "" },
    /** Public URL or site path for the main collection image. */
    mainImage: { type: String, default: "" },
    /** Public URL or site path for the clear-background collection image. */
    clearBackground_Image: { type: String, default: "" },
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
