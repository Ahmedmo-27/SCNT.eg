const testClient = require("../helpers/testClient");
const { getAdminAuth, getUserAuth } = require("../helpers/authHelper");
const { cleanTestCollections } = require("../helpers/seedHelper");
const Order = require("../../src/models/Order");
const User = require("../../src/models/User");
const Collection = require("../../src/models/Collection");
const PromoCode = require("../../src/models/PromoCode");

describe("Admin Domain Test Suite", () => {
  let adminAuth;
  let testUserAuth;
  let testOrder;

  beforeAll(async () => {
    await cleanTestCollections();
    adminAuth = await getAdminAuth({ email: `admin.domain.${Date.now()}@scnt.eg` });
    testUserAuth = await getUserAuth({ email: `admin.target.user.${Date.now()}@scnt.eg` });

    // Seed a test order for order management tests
    testOrder = await Order.create({
      user: testUserAuth.user._id,
      items: [
        {
          product: "650000000000000000000001",
          size: "100ml",
          quantity: 1,
          price: 750,
        },
      ],
      subtotal: 750,
      shipping: 80,
      discount: 0,
      total: 830,
      status: "PENDING",
      address: {
        fullName: "Test Admin Customer",
        phone: "01011112222",
        city: "Cairo",
        addressLine1: "1 Admin Way",
        postalCode: "11511",
      },
    });
  });

  afterAll(async () => {
    await cleanTestCollections();
  });

  describe("Dashboard Telemetry Summary (GET /api/admin/dashboard)", () => {
    it("retrieves storewide aggregated metrics and business KPIs", async () => {
      const res = await testClient.get("/api/admin/dashboard", adminAuth.headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();

      const { usersCount, productsCount, ordersCount, collectionsCount, pendingOrders, totalRevenue } =
        res.body.data;
      expect(typeof usersCount).toBe("number");
      expect(typeof productsCount).toBe("number");
      expect(typeof ordersCount).toBe("number");
      expect(typeof collectionsCount).toBe("number");
      expect(typeof pendingOrders).toBe("number");
      expect(typeof totalRevenue).toBe("number");
      expect(ordersCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Order Management & Status Transitions (GET/PUT /api/admin/orders)", () => {
    it("retrieves storewide order listing", async () => {
      const res = await testClient.get("/api/admin/orders", adminAuth.headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const found = res.body.data.find((o) => o._id === testOrder._id.toString());
      expect(found).toBeDefined();
    });

    it("transitions order status from PENDING to CONFIRMED and SHIPPED", async () => {
      // Transition to CONFIRMED
      const confirmRes = await testClient.put(
        `/api/admin/orders/${testOrder._id}/status`,
        { status: "CONFIRMED" },
        adminAuth.headers
      );

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.success).toBe(true);
      expect(confirmRes.body.message).toBe("Order status updated");
      expect(confirmRes.body.data.status).toBe("CONFIRMED");

      // Transition to SHIPPED
      const shipRes = await testClient.put(
        `/api/admin/orders/${testOrder._id}/status`,
        { status: "SHIPPED" },
        adminAuth.headers
      );

      expect(shipRes.status).toBe(200);
      expect(shipRes.body.success).toBe(true);
      expect(shipRes.body.data.status).toBe("SHIPPED");

      // Verify in database
      const dbOrder = await Order.findById(testOrder._id);
      expect(dbOrder.status).toBe("SHIPPED");
    });
  });

  describe("User Role Management (PATCH /api/admin/users/:id/role)", () => {
    it("promotes standard user to admin and reverts back to user", async () => {
      const targetUserId = testUserAuth.user._id.toString();

      // Promote to admin
      const promoteRes = await testClient.patch(
        `/api/admin/users/${targetUserId}/role`,
        { role: "admin" },
        adminAuth.headers
      );

      expect(promoteRes.status).toBe(200);
      expect(promoteRes.body.success).toBe(true);
      expect(promoteRes.body.message).toBe("User role updated");
      expect(promoteRes.body.data.role).toBe("admin");

      // Revert back to user
      const revertRes = await testClient.patch(
        `/api/admin/users/${targetUserId}/role`,
        { role: "user" },
        adminAuth.headers
      );

      expect(revertRes.status).toBe(200);
      expect(revertRes.body.success).toBe(true);
      expect(revertRes.body.data.role).toBe("user");

      const dbUser = await User.findById(targetUserId);
      expect(dbUser.role).toBe("user");
    });
  });

  describe("Collections CRUD Domain (/api/admin/collections)", () => {
    let createdCollectionId;
    const uniqueColSlug = `admin-col-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    it("creates a new fragrance collection via POST", async () => {
      const createPayload = {
        name: "Admin Royal Collection",
        slug: uniqueColSlug,
        tagline: "Finest royal extractions",
        sub_tagline: "Exclusive luxury line",
        description: "Created by automated admin test suite.",
        themeColor: "#0f172a",
        coverImage: "https://scnt-eg.me/images/royal-cover.webp",
      };

      const res = await testClient.post("/api/admin/collections", createPayload, adminAuth.headers);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Collection created");
      expect(res.body.data).toBeDefined();
      expect(res.body.data.slug).toBe(uniqueColSlug);

      createdCollectionId = res.body.data._id;
    });

    it("lists collections via GET and includes created collection", async () => {
      const res = await testClient.get("/api/admin/collections", adminAuth.headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const found = res.body.data.find((c) => c._id === createdCollectionId);
      expect(found).toBeDefined();
      expect(found.name).toBe("Admin Royal Collection");
    });

    it("updates collection details via PUT", async () => {
      const updatePayload = {
        name: "Admin Imperial Collection",
        tagline: "Updated imperial fragrances",
      };

      const res = await testClient.put(
        `/api/admin/collections/${createdCollectionId}`,
        updatePayload,
        adminAuth.headers
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Collection updated");
      expect(res.body.data.name).toBe("Admin Imperial Collection");
      expect(res.body.data.tagline).toBe("Updated imperial fragrances");
    });

    it("deletes empty collection via DELETE", async () => {
      const res = await testClient.del(
        `/api/admin/collections/${createdCollectionId}`,
        adminAuth.headers
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await Collection.findById(createdCollectionId);
      expect(check).toBeNull();
    });
  });

  describe("Promo Codes CRUD Domain (/api/admin/promo-codes)", () => {
    let createdPromoId;
    const promoCode = `PROMO${Date.now()}`;

    it("creates a new promotional discount code via POST", async () => {
      const createPayload = {
        code: promoCode,
        discountType: "PERCENTAGE",
        discountValue: 25,
        minSubtotal: 300,
        maxDiscount: 150,
        isActive: true,
      };

      const res = await testClient.post("/api/admin/promo-codes", createPayload, adminAuth.headers);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Promo code created");
      expect(res.body.data).toBeDefined();
      expect(res.body.data.code).toBe(promoCode.toUpperCase());
      expect(res.body.data.discountValue).toBe(25);

      createdPromoId = res.body.data._id;
    });

    it("lists all promo codes via GET and includes the created promo", async () => {
      const res = await testClient.get("/api/admin/promo-codes", adminAuth.headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const found = res.body.data.find((p) => p._id === createdPromoId);
      expect(found).toBeDefined();
      expect(found.code).toBe(promoCode.toUpperCase());
    });

    it("updates promo code discount value and rules via PUT", async () => {
      const updatePayload = {
        code: promoCode,
        discountType: "PERCENTAGE",
        discountValue: 30,
        minSubtotal: 400,
        maxDiscount: 200,
        isActive: true,
      };

      const res = await testClient.put(
        `/api/admin/promo-codes/${createdPromoId}`,
        updatePayload,
        adminAuth.headers
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Promo code updated");
      expect(res.body.data.discountValue).toBe(30);
      expect(res.body.data.minSubtotal).toBe(400);
    });

    it("deletes promo code via DELETE", async () => {
      const res = await testClient.del(
        `/api/admin/promo-codes/${createdPromoId}`,
        adminAuth.headers
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Promo code deleted");

      const check = await PromoCode.findById(createdPromoId);
      expect(check).toBeNull();
    });
  });
});
