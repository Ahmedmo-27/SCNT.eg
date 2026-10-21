const testClient = require("../helpers/testClient");
const { getAdminAuth, getUserAuth } = require("../helpers/authHelper");
const { seedTestCollection, seedTestProduct, cleanTestCollections } = require("../helpers/seedHelper");
const Collection = require("../../src/models/Collection");

describe("Admin Defensive Boundary & Edge-Case Validation Harness", () => {
  let adminAuth;
  let regularUserAuth;
  let populatedCollection;
  let assignedProduct;

  beforeAll(async () => {
    await cleanTestCollections();
    adminAuth = await getAdminAuth({ email: `admin.edge.${Date.now()}@scnt.eg` });
    regularUserAuth = await getUserAuth({ email: `regular.user.edge.${Date.now()}@scnt.eg` });

    // Seed a collection that has an assigned product
    populatedCollection = await seedTestCollection({
      name: "Protected Collection with Products",
      slug: `protected-col-${Date.now()}`,
    });

    assignedProduct = await seedTestProduct({
      name: "Assigned Fragrance to Collection",
      collection: populatedCollection._id.toString(),
      price: 900,
      stock: 20,
    });
  });

  afterAll(async () => {
    await cleanTestCollections();
  });

  describe("Authentication and Role Access Boundaries (401 / 403)", () => {
    it("rejects unauthenticated access to admin dashboard (missing token)", async () => {
      const res = await testClient.get("/api/admin/dashboard");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/token is required/i);
    });

    it("rejects access to admin dashboard from regular non-admin user", async () => {
      const res = await testClient.get("/api/admin/dashboard", regularUserAuth.headers);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/admin access required/i);
    });

    it("rejects regular user from accessing admin orders list", async () => {
      const res = await testClient.get("/api/admin/orders", regularUserAuth.headers);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/admin access required/i);
    });

    it("rejects regular user from modifying collections", async () => {
      const res = await testClient.post(
        "/api/admin/collections",
        { name: "Unauthorized Collection", slug: "unauth-col" },
        regularUserAuth.headers
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/admin access required/i);
    });
  });

  describe("Admin Self-Account Deletion Prevention (400 Bad Request)", () => {
    it("strictly prevents an admin from deleting their own user account", async () => {
      const adminUserId = adminAuth.user._id.toString();

      const res = await testClient.del(`/api/admin/users/${adminUserId}`, adminAuth.headers);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cannot delete your own account/i);
    });
  });

  describe("Collection Integrity Safeguards (400 Bad Request)", () => {
    it("blocks deletion of a collection that currently has associated products", async () => {
      const colId = populatedCollection._id.toString();

      const res = await testClient.del(`/api/admin/collections/${colId}`, adminAuth.headers);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/collection has products and cannot be deleted/i);

      // Verify collection still exists in database
      const check = await Collection.findById(colId);
      expect(check).toBeDefined();
      expect(check).not.toBeNull();
    });

    it("returns 404 when attempting to delete a non-existent collection", async () => {
      const nonExistentColId = "650000000000000000000055";

      const res = await testClient.del(
        `/api/admin/collections/${nonExistentColId}`,
        adminAuth.headers
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/collection not found/i);
    });
  });

  describe("User Role Assignment Boundaries (400 Bad Request)", () => {
    it("rejects assigning an invalid or unsupported role string", async () => {
      const targetUserId = regularUserAuth.user._id.toString();

      const res = await testClient.patch(
        `/api/admin/users/${targetUserId}/role`,
        { role: "superadmin_invalid" },
        adminAuth.headers
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/role must be either user or admin/i);
    });

    it("rejects empty role in role assignment", async () => {
      const targetUserId = regularUserAuth.user._id.toString();

      const res = await testClient.patch(
        `/api/admin/users/${targetUserId}/role`,
        { role: "" },
        adminAuth.headers
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/role must be either user or admin/i);
    });
  });

  describe("Order Status Transition Boundaries (400 Bad Request)", () => {
    it("rejects transitioning order to an unsupported status enum value", async () => {
      // Create a dummy ObjectId for order
      const fakeOrderId = "650000000000000000000066";

      const res = await testClient.put(
        `/api/admin/orders/${fakeOrderId}/status`,
        { status: "INVALID_STATUS_CODE" },
        adminAuth.headers
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid status/i);
    });
  });
});
