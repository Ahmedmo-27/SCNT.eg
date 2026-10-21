const testClient = require("../helpers/testClient");
const { getUserAuth } = require("../helpers/authHelper");
const { seedTestProduct, cleanTestCollections } = require("../helpers/seedHelper");
const PromoCode = require("../../src/models/PromoCode");

describe("Cart Domain Test Suite", () => {
  let userAuth;
  let testProduct1;
  let testProduct2;
  let promoCodeDoc;

  beforeAll(async () => {
    await cleanTestCollections();
    userAuth = await getUserAuth({ email: `cart.domain.${Date.now()}@scnt.eg` });

    // Seed two test products
    testProduct1 = await seedTestProduct({
      name: "Cart Fragrance Alpha",
      price: 800,
      sizes: [
        { size: "50ml", price: 500, stock: 20 },
        { size: "100ml", price: 800, stock: 30 },
      ],
      stock: 50,
    });

    testProduct2 = await seedTestProduct({
      name: "Cart Fragrance Beta",
      price: 600,
      sizes: [
        { size: "50ml", price: 400, stock: 15 },
        { size: "100ml", price: 600, stock: 25 },
      ],
      stock: 40,
    });

    // Seed a valid active promo code (20% off)
    promoCodeDoc = await PromoCode.create({
      code: `SAVE20-${Date.now()}`,
      discountType: "PERCENTAGE",
      discountValue: 20,
      minSubtotal: 200,
      isActive: true,
    });
  });

  afterAll(async () => {
    await cleanTestCollections();
  });

  describe("Get Active Cart (GET /api/cart)", () => {
    it("returns an empty cart initial state for authenticated user", async () => {
      const res = await testClient.get("/api/cart", userAuth.headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBe(0);
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.summary.subtotal).toBe(0);
      expect(res.body.data.summary.total).toBe(0); // 0 when cart has no items
    });
  });

  describe("Add Item to Cart (POST /api/cart/add)", () => {
    it("adds a product line with quantity and size to the active cart", async () => {
      const payload = {
        productId: testProduct1._id.toString(),
        quantity: 2,
        size: "100ml",
      };

      const res = await testClient.post("/api/cart/add", payload, userAuth.headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Item added to cart");
      expect(res.body.data.items.length).toBe(1);

      const line = res.body.data.lines[0];
      expect(line.productId).toBe(testProduct1._id.toString());
      expect(line.quantity).toBe(2);
      expect(line.size).toBe("100ml");
      expect(line.unitPrice).toBe(800);
      expect(line.lineTotal).toBe(1600);

      expect(res.body.data.summary.subtotal).toBe(1600);
      expect(res.body.data.summary.shipping).toBe(80);
      expect(res.body.data.summary.total).toBe(1680);
    });
  });

  describe("Update Item Quantity (POST /api/cart/update)", () => {
    it("updates quantity of existing cart item", async () => {
      const updatePayload = {
        productId: testProduct1._id.toString(),
        quantity: 3,
        size: "100ml",
      };

      const res = await testClient.post("/api/cart/update", updatePayload, userAuth.headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Cart updated");
      expect(res.body.data.lines[0].quantity).toBe(3);
      expect(res.body.data.summary.subtotal).toBe(2400); // 3 * 800
      expect(res.body.data.summary.total).toBe(2480);
    });

    it("removes line item when quantity is updated to 0", async () => {
      const removeByZeroPayload = {
        productId: testProduct1._id.toString(),
        quantity: 0,
        size: "100ml",
      };

      const res = await testClient.post("/api/cart/update", removeByZeroPayload, userAuth.headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Cart updated");
      expect(res.body.data.items.length).toBe(0);
      expect(res.body.data.summary.subtotal).toBe(0);
    });
  });

  describe("Remove Item (POST /api/cart/remove)", () => {
    it("removes specified product line from cart", async () => {
      // First add an item back
      await testClient.post(
        "/api/cart/add",
        { productId: testProduct2._id.toString(), quantity: 1, size: "50ml" },
        userAuth.headers
      );

      const removePayload = {
        productId: testProduct2._id.toString(),
        size: "50ml",
      };

      const res = await testClient.post("/api/cart/remove", removePayload, userAuth.headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Item removed from cart");
      expect(res.body.data.items.length).toBe(0);
    });
  });

  describe("Replace Entire Cart (POST /api/cart/replace)", () => {
    it("atomically replaces entire cart contents with array of lines", async () => {
      const replacePayload = {
        lines: [
          { productId: testProduct1._id.toString(), quantity: 1, size: "50ml" },
          { productId: testProduct2._id.toString(), quantity: 2, size: "100ml" },
        ],
      };

      const res = await testClient.post("/api/cart/replace", replacePayload, userAuth.headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Cart replaced");
      expect(res.body.data.lines.length).toBe(2);

      // 1x 500 (testProduct1 50ml) + 2x 600 (testProduct2 100ml) = 1700
      expect(res.body.data.summary.subtotal).toBe(1700);
      expect(res.body.data.summary.shipping).toBe(80);
      expect(res.body.data.summary.total).toBe(1780);
    });
  });

  describe("Promo Code Management (POST /api/cart/promo/*)", () => {
    it("applies valid promo code and recalculates discount accurately", async () => {
      const applyPayload = { code: promoCodeDoc.code };

      const res = await testClient.post("/api/cart/promo/apply", applyPayload, userAuth.headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Promo code applied");
      expect(res.body.data.promoCode).toBe(promoCodeDoc.code);

      // Subtotal = 1700, 20% discount = 340, shipping = 80, total = 1700 + 80 - 340 = 1440
      expect(res.body.data.summary.discount).toBe(340);
      expect(res.body.data.summary.total).toBe(1440);
    });

    it("removes applied promo code and recalculates summary", async () => {
      const res = await testClient.post("/api/cart/promo/remove", {}, userAuth.headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Promo code removed");
      expect(res.body.data.promoCode).toBe("");
      expect(res.body.data.summary.discount).toBe(0);
      expect(res.body.data.summary.total).toBe(1780);
    });
  });

  describe("Clear Cart (POST /api/cart/clear)", () => {
    it("empties all items and promo codes from active cart", async () => {
      const res = await testClient.post("/api/cart/clear", {}, userAuth.headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Cart cleared");
      expect(res.body.data.items.length).toBe(0);
      expect(res.body.data.summary.subtotal).toBe(0);
      expect(res.body.data.summary.discount).toBe(0);
      expect(res.body.data.summary.total).toBe(0);
    });
  });
});
