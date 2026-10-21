const testClient = require("../helpers/testClient");
const { getUserAuth } = require("../helpers/authHelper");
const { seedTestProduct, cleanTestCollections } = require("../helpers/seedHelper");
const Order = require("../../src/models/Order");

describe("Orders Defensive Boundary & Edge-Case Validation Harness", () => {
  let userAAuth;
  let userBAuth;
  let limitedStockProduct;
  let userAOrder;

  beforeAll(async () => {
    await cleanTestCollections();
    userAAuth = await getUserAuth({ email: `order.edge.userA.${Date.now()}@scnt.eg` });
    userBAuth = await getUserAuth({ email: `order.edge.userB.${Date.now()}@scnt.eg` });

    // Seed product with very low stock (stock: 2)
    limitedStockProduct = await seedTestProduct({
      name: "Limited Stock Perfume",
      price: 1200,
      stock: 2,
      sizes: [
        { size: "50ml", price: 800, stock: 1 },
        { size: "100ml", price: 1200, stock: 2 },
      ],
    });

    // Seed an order belonging to User A for cross-user authorization tests
    userAOrder = await Order.create({
      user: userAAuth.user._id,
      items: [
        {
          product: limitedStockProduct._id,
          size: "100ml",
          quantity: 1,
          price: 1200,
        },
      ],
      subtotal: 1200,
      shipping: 80,
      discount: 0,
      total: 1280,
      status: "PENDING",
      address: {
        fullName: "User A",
        phone: "01011112222",
        city: "Cairo",
        addressLine1: "User A Street",
        postalCode: "11511",
      },
    });
  });

  afterAll(async () => {
    await cleanTestCollections();
  });

  describe("Authentication Boundaries (401 Unauthorized)", () => {
    it("rejects order checkout when unauthenticated (missing token)", async () => {
      const res = await testClient.post("/api/orders", {
        address: {
          fullName: "Guest",
          phone: "01000000000",
          city: "Cairo",
          addressLine1: "Street 1",
          postalCode: "11511",
        },
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/token is required/i);
    });

    it("rejects order retrieval when unauthenticated", async () => {
      const res = await testClient.get("/api/orders/my-orders");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/token is required/i);
    });
  });

  describe("Empty Cart Checkout (400 Bad Request)", () => {
    it("rejects checkout when user active cart contains 0 items", async () => {
      // Ensure User B's cart is empty
      await testClient.post("/api/cart/clear", {}, userBAuth.headers);

      const addressPayload = {
        address: {
          fullName: "User B",
          phone: "01022223333",
          city: "Giza",
          addressLine1: "Pyramids St",
          postalCode: "12345",
        },
      };

      const res = await testClient.post("/api/orders", addressPayload, userBAuth.headers);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cart is empty/i);
    });
  });

  describe("Inventory Availability Boundaries (400 Insufficient Stock)", () => {
    it("rejects checkout when item quantity exceeds available inventory stock", async () => {
      // Add 10 units when available stock is only 2
      await testClient.post(
        "/api/cart/add",
        {
          productId: limitedStockProduct._id.toString(),
          quantity: 10,
          size: "100ml",
        },
        userBAuth.headers
      );

      const addressPayload = {
        address: {
          fullName: "User B",
          phone: "01022223333",
          city: "Giza",
          addressLine1: "Pyramids St",
          postalCode: "12345",
        },
      };

      const res = await testClient.post("/api/orders", addressPayload, userBAuth.headers);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/insufficient stock/i);

      // Clean User B's cart
      await testClient.post("/api/cart/clear", {}, userBAuth.headers);
    });
  });

  describe("Incomplete Shipping Address Boundaries (400 Bad Request)", () => {
    beforeEach(async () => {
      // Seed an available product with enough stock for address tests
      await testClient.post(
        "/api/cart/add",
        {
          productId: limitedStockProduct._id.toString(),
          quantity: 1,
          size: "100ml",
        },
        userBAuth.headers
      );
    });

    afterEach(async () => {
      await testClient.post("/api/cart/clear", {}, userBAuth.headers);
    });

    it("rejects checkout when city is missing from address", async () => {
      const res = await testClient.post(
        "/api/orders",
        {
          address: {
            fullName: "User B",
            phone: "01022223333",
            addressLine1: "Pyramids St",
            postalCode: "12345",
          },
        },
        userBAuth.headers
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/city.*required/i);
    });

    it("rejects checkout when addressLine1 is missing from address", async () => {
      const res = await testClient.post(
        "/api/orders",
        {
          address: {
            fullName: "User B",
            phone: "01022223333",
            city: "Giza",
            postalCode: "12345",
          },
        },
        userBAuth.headers
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/addressLine1.*required/i);
    });

    it("rejects checkout when fullName is missing from address", async () => {
      const res = await testClient.post(
        "/api/orders",
        {
          address: {
            phone: "01022223333",
            city: "Giza",
            addressLine1: "Pyramids St",
            postalCode: "12345",
          },
        },
        userBAuth.headers
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/fullName.*required/i);
    });

    it("rejects checkout when phone is missing from address", async () => {
      const res = await testClient.post(
        "/api/orders",
        {
          address: {
            fullName: "User B",
            city: "Giza",
            addressLine1: "Pyramids St",
            postalCode: "12345",
          },
        },
        userBAuth.headers
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/phone.*required/i);
    });

    it("rejects checkout when postalCode is missing from address", async () => {
      const res = await testClient.post(
        "/api/orders",
        {
          address: {
            fullName: "User B",
            phone: "01022223333",
            city: "Giza",
            addressLine1: "Pyramids St",
          },
        },
        userBAuth.headers
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/postalCode.*required/i);
    });
  });

  describe("Cross-User Order Access Security Safeguards (403 Forbidden)", () => {
    it("strictly prevents User B from accessing User A's order details", async () => {
      const res = await testClient.get(`/api/orders/${userAOrder._id}`, userBAuth.headers);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    it("returns 404 when querying non-existent order ID", async () => {
      const nonExistentOrderId = "650000000000000000000077";
      const res = await testClient.get(`/api/orders/${nonExistentOrderId}`, userAAuth.headers);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/order not found/i);
    });
  });
});
