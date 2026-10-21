const testClient = require("../helpers/testClient");
const { getUserAuth } = require("../helpers/authHelper");
const { seedTestProduct, cleanTestCollections } = require("../helpers/seedHelper");
const Product = require("../../src/models/Product");

describe("Orders Domain Test Suite", () => {
  let userAuth;
  let testProduct;
  let createdOrder;
  const initialStock = 50;
  const orderQuantity = 3;

  beforeAll(async () => {
    await cleanTestCollections();
    userAuth = await getUserAuth({ email: `order.domain.${Date.now()}@scnt.eg` });

    // Seed test product with explicit stock
    testProduct = await seedTestProduct({
      name: "Checkout Fragrance Alpha",
      price: 900,
      stock: initialStock,
      sizes: [
        { size: "50ml", price: 600, stock: 20 },
        { size: "100ml", price: 900, stock: initialStock },
      ],
    });

    // Populate user's cart with items
    await testClient.post(
      "/api/cart/add",
      {
        productId: testProduct._id.toString(),
        quantity: orderQuantity,
        size: "100ml",
      },
      userAuth.headers
    );
  });

  afterAll(async () => {
    await cleanTestCollections();
  });

  describe("Checkout Order Creation (POST /api/orders)", () => {
    it("converts user cart into a confirmed pending order with shipping address", async () => {
      const addressPayload = {
        address: {
          fullName: "Ahmed Customer",
          phone: "01012345678",
          city: "Alexandria",
          addressLine1: "25 Stanley Bridge Way",
          addressLine2: "Floor 3",
          postalCode: "21500",
        },
      };

      const res = await testClient.post("/api/orders", addressPayload, userAuth.headers);

      expect(res.status).toBe(201);
      expect(res.body).toBeDefined();
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Order created");

      createdOrder = res.body.data;
      expect(createdOrder).toBeDefined();
      expect(createdOrder._id).toBeDefined();
      expect(createdOrder.status).toBe("PENDING");
      expect(createdOrder.items.length).toBe(1);
      expect(createdOrder.items[0].quantity).toBe(orderQuantity);
      expect(createdOrder.items[0].price).toBe(900);

      // Subtotal = 3 * 900 = 2700, shipping = 80, total = 2780
      expect(createdOrder.subtotal).toBe(2700);
      expect(createdOrder.shipping).toBe(80);
      expect(createdOrder.discount).toBe(0);
      expect(createdOrder.total).toBe(2780);

      expect(createdOrder.address.city).toBe("Alexandria");
      expect(createdOrder.address.fullName).toBe("Ahmed Customer");

      // Verify that user cart was emptied upon successful checkout
      const cartRes = await testClient.get("/api/cart", userAuth.headers);
      expect(cartRes.status).toBe(200);
      expect(cartRes.body.data.items.length).toBe(0);
      expect(cartRes.body.data.summary.subtotal).toBe(0);
    });
  });

  describe("Inventory Stock Decrement Verification", () => {
    it("verifies product stock was accurately decremented by the purchased quantity", async () => {
      const updatedProduct = await Product.findById(testProduct._id);
      expect(updatedProduct).toBeDefined();

      const expectedStock = initialStock - orderQuantity;
      expect(updatedProduct.stock).toBe(expectedStock);
    });
  });

  describe("Current User Order History (GET /api/orders/my-orders)", () => {
    it("retrieves list of orders placed by the authenticated user", async () => {
      const res = await testClient.get("/api/orders/my-orders", userAuth.headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const found = res.body.data.find((o) => o._id === createdOrder._id);
      expect(found).toBeDefined();
      expect(found.total).toBe(2780);
      expect(found.status).toBe("PENDING");
    });
  });

  describe("Order Detail by ID (GET /api/orders/:id)", () => {
    it("retrieves detailed order record for the authenticated owner", async () => {
      const res = await testClient.get(`/api/orders/${createdOrder._id}`, userAuth.headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data._id).toBe(createdOrder._id);
      expect(res.body.data.total).toBe(2780);
      expect(res.body.data.address.city).toBe("Alexandria");
      expect(res.body.data.status).toBe("PENDING");
    });
  });
});
