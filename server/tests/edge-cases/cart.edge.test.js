const testClient = require("../helpers/testClient");
const { getUserAuth } = require("../helpers/authHelper");
const { seedTestProduct, cleanTestCollections } = require("../helpers/seedHelper");
const PromoCode = require("../../src/models/PromoCode");
const Order = require("../../src/models/Order");

describe("Cart Defensive Boundary & Edge-Case Validation Harness", () => {
  let userAuth;
  let testProduct;

  beforeAll(async () => {
    await cleanTestCollections();
    userAuth = await getUserAuth({ email: `cart.edge.${Date.now()}@scnt.eg` });

    testProduct = await seedTestProduct({
      name: "Cart Edge Test Fragrance",
      price: 500,
      stock: 50,
      sizes: [
        { size: "50ml", price: 350, stock: 25 },
        { size: "100ml", price: 500, stock: 25 },
      ],
    });
  });

  afterAll(async () => {
    await cleanTestCollections();
  });

  describe("Cart Identity Resolution Boundaries (400 Bad Request)", () => {
    it("rejects request missing both user authentication and visitor identifier", async () => {
      const res = await testClient.get("/api/cart");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/missing user authentication or visitor identifier/i);
    });
  });

  describe("Product Addition Boundaries (400 / 404)", () => {
    beforeEach(async () => {
      // Ensure clean cart before each addition boundary test
      await testClient.post("/api/cart/clear", {}, userAuth.headers);
    });

    it("rejects adding item with negative quantity (quantity: -3)", async () => {
      const payload = {
        productId: testProduct._id.toString(),
        quantity: -3,
      };

      const res = await testClient.post("/api/cart/add", payload, userAuth.headers);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/quantity must be greater than 0/i);
    });

    it("rejects adding item with string zero quantity ('0')", async () => {
      const payload = {
        productId: testProduct._id.toString(),
        quantity: "0",
      };

      const res = await testClient.post("/api/cart/add", payload, userAuth.headers);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/quantity must be greater than 0/i);
    });

    it("rejects adding item with malformed product ObjectId", async () => {
      const payload = {
        productId: "invalid-not-an-objectid",
        quantity: 1,
      };

      const res = await testClient.post("/api/cart/add", payload, userAuth.headers);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid product id/i);
    });

    it("returns 404 when product ID does not exist in database", async () => {
      const payload = {
        productId: "650000000000000000000099",
        quantity: 1,
      };

      const res = await testClient.post("/api/cart/add", payload, userAuth.headers);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/product not found/i);
    });
  });

  describe("Cart Item Update Boundaries (400 / 404)", () => {
    beforeEach(async () => {
      await testClient.post("/api/cart/clear", {}, userAuth.headers);
    });

    it("rejects updating item with negative quantity", async () => {
      // Add product to cart first
      await testClient.post(
        "/api/cart/add",
        { productId: testProduct._id.toString(), quantity: 1, size: "100ml" },
        userAuth.headers
      );

      const payload = {
        productId: testProduct._id.toString(),
        quantity: -5,
        size: "100ml",
      };

      const res = await testClient.post("/api/cart/update", payload, userAuth.headers);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/quantity cannot be negative/i);
    });

    it("returns 404 when updating product line not present in the active cart", async () => {
      const nonPresentProductId = "650000000000000000000088";
      const payload = {
        productId: nonPresentProductId,
        quantity: 2,
        size: "100ml",
      };

      const res = await testClient.post("/api/cart/update", payload, userAuth.headers);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/item not found in cart/i);
    });
  });

  describe("Promo Code Application Boundaries (400 Bad Request)", () => {
    let existingPromo;

    beforeAll(async () => {
      existingPromo = await PromoCode.create({
        code: `EDGEPROMO-${Date.now()}`,
        discountType: "PERCENTAGE",
        discountValue: 15,
        minSubtotal: 100,
        isActive: true,
      });
    });

    beforeEach(async () => {
      await testClient.post("/api/cart/clear", {}, userAuth.headers);
    });

    it("rejects promo code application when cart is completely empty", async () => {
      const res = await testClient.post(
        "/api/cart/promo/apply",
        { code: existingPromo.code },
        userAuth.headers
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cart is empty/i);
    });

    it("rejects applying a promo code that does not exist", async () => {
      // Add product to cart first so cart is not empty
      await testClient.post(
        "/api/cart/add",
        { productId: testProduct._id.toString(), quantity: 1, size: "100ml" },
        userAuth.headers
      );

      const res = await testClient.post(
        "/api/cart/promo/apply",
        { code: "NONEXISTENTPROMO" },
        userAuth.headers
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/promo code does not exist/i);
    });

    it("rejects applying an expired promo code", async () => {
      await testClient.post(
        "/api/cart/add",
        { productId: testProduct._id.toString(), quantity: 1, size: "100ml" },
        userAuth.headers
      );

      const expiredPromo = await PromoCode.create({
        code: `EXPIRED-${Date.now()}`,
        discountType: "PERCENTAGE",
        discountValue: 10,
        expiresAt: new Date(Date.now() - 3600000), // Expired 1 hour ago
        isActive: true,
      });

      const res = await testClient.post(
        "/api/cart/promo/apply",
        { code: expiredPromo.code },
        userAuth.headers
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/expired/i);
    });

    it("rejects promo code when cart subtotal is below minSubtotal requirement", async () => {
      await testClient.post(
        "/api/cart/add",
        { productId: testProduct._id.toString(), quantity: 1, size: "100ml" },
        userAuth.headers
      );

      const highThresholdPromo = await PromoCode.create({
        code: `MINSUB-${Date.now()}`,
        discountType: "PERCENTAGE",
        discountValue: 15,
        minSubtotal: 5000, // Current cart subtotal is 500
        isActive: true,
      });

      const res = await testClient.post(
        "/api/cart/promo/apply",
        { code: highThresholdPromo.code },
        userAuth.headers
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/minimum subtotal/i);
    });

    it("rejects promo code that is inactive (isActive: false)", async () => {
      await testClient.post(
        "/api/cart/add",
        { productId: testProduct._id.toString(), quantity: 1, size: "100ml" },
        userAuth.headers
      );

      const inactivePromo = await PromoCode.create({
        code: `INACTIVE-${Date.now()}`,
        discountType: "PERCENTAGE",
        discountValue: 15,
        isActive: false,
      });

      const res = await testClient.post(
        "/api/cart/promo/apply",
        { code: inactivePromo.code },
        userAuth.headers
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/inactive/i);
    });

    it("rejects promo code previously used by the user in a completed order", async () => {
      await testClient.post(
        "/api/cart/add",
        { productId: testProduct._id.toString(), quantity: 1, size: "100ml" },
        userAuth.headers
      );

      const singleUsePromo = await PromoCode.create({
        code: `ONCEONLY-${Date.now()}`,
        discountType: "FIXED",
        discountValue: 50,
        isActive: true,
      });

      // Seed an order completed by this user with this promo code
      await Order.create({
        user: userAuth.user._id,
        items: [
          {
            product: testProduct._id,
            size: "100ml",
            quantity: 1,
            price: 500,
          },
        ],
        subtotal: 500,
        shipping: 80,
        discount: 50,
        promoCode: singleUsePromo.code,
        total: 530,
        address: {
          fullName: "Single Use Customer",
          phone: "01012345678",
          city: "Cairo",
          addressLine1: "1 Street",
          postalCode: "11511",
        },
      });

      const res = await testClient.post(
        "/api/cart/promo/apply",
        { code: singleUsePromo.code },
        userAuth.headers
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already used this promo code/i);
    });
  });
});
