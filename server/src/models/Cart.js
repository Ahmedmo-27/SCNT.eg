const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    size: { type: String, default: "100ml" },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: undefined },
    visitorId: { type: String, default: undefined, trim: true },
    sessionId: { type: String, default: undefined, trim: true },
    items: { type: [cartItemSchema], default: [] },
    promoCode: { type: String, default: "", uppercase: true, trim: true },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Unique partial filter indexes so uniqueness is ONLY enforced when the field is populated
cartSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { user: { $type: "objectId" } } }
);
cartSchema.index(
  { visitorId: 1 },
  { unique: true, partialFilterExpression: { visitorId: { $type: "string" } } }
);
cartSchema.index({ lastActiveAt: -1 });

// TTL index to automatically remove guest carts inactive for 30 days
cartSchema.index(
  { lastActiveAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { visitorId: { $exists: true } } }
);

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
