const testClient = require("../helpers/testClient");
const { getAdminAuth } = require("../helpers/authHelper");
const { seedTestCollection, seedTestProduct, cleanTestCollections } = require("../helpers/seedHelper");
const Product = require("../../src/models/Product");

describe("Products Defensive Boundary & Defect Audit Edge-Case Suite", () => {
  let adminAuth;
  let testCollection;
  let seededProduct;

  beforeAll(async () => {
    await cleanTestCollections();
    adminAuth = await getAdminAuth();
    testCollection = await seedTestCollection();

    seededProduct = await seedTestProduct({
      name: "Existing Anchor Product",
      slug: `anchor-slug-${Date.now()}`,
      inspired_from: `Anchor Inspiration ${Date.now()}`,
      collection: testCollection._id.toString(),
      price: 850,
      stock: 50,
    });
  });

  afterAll(async () => {
    await cleanTestCollections();
  });

  describe("Negative and Invalid Numeric Boundaries", () => {
    it("rejects product creation with negative price and documents 500 status code defect", async () => {
      const payload = {
        name: "Negative Price Fragrance",
        slug: `neg-price-${Date.now()}`,
        inspired_from: `Neg Price Source ${Date.now()}`,
        collection: testCollection._id.toString(),
        price: -250, // Negative price violation
        stock: 10,
      };

      const res = await testClient.post("/api/products", payload, adminAuth.headers);

      // Rejection assertion
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);

      // Defect Audit: Mongoose ValidationError bubbles to errorHandler without err.statusCode, defaulting to 500
      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/validation failed|price/i);

      // Verify product was not created in database
      const check = await Product.findOne({ slug: payload.slug });
      expect(check).toBeNull();
    });

    it("rejects product creation with negative stock and documents 500 status code defect", async () => {
      const payload = {
        name: "Negative Stock Fragrance",
        slug: `neg-stock-${Date.now()}`,
        inspired_from: `Neg Stock Source ${Date.now()}`,
        collection: testCollection._id.toString(),
        price: 700,
        stock: -15, // Negative stock violation
      };

      const res = await testClient.post("/api/products", payload, adminAuth.headers);

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);

      // Defect Audit: Defaults to 500 due to unhandled Mongoose ValidationError
      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/validation failed|stock/i);

      const check = await Product.findOne({ slug: payload.slug });
      expect(check).toBeNull();
    });
  });

  describe("Unique Index Collisions (Duplicate Slug & inspired_from)", () => {
    it("rejects product creation with duplicate slug and documents E11000 500 error defect", async () => {
      const payload = {
        name: "Duplicate Slug Fragrance",
        slug: seededProduct.slug, // Already exists
        inspired_from: `Different Source ${Date.now()}`,
        collection: testCollection._id.toString(),
        price: 750,
        stock: 20,
      };

      const res = await testClient.post("/api/products", payload, adminAuth.headers);

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);

      // Defect Audit: MongoDB E11000 duplicate key error is unhandled in controller and returns 500 instead of 409
      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/duplicate key|E11000/i);
    });

    it("rejects product creation with duplicate inspired_from and documents E11000 500 error defect", async () => {
      const payload = {
        name: "Duplicate Inspired Fragrance",
        slug: `unique-slug-${Date.now()}`,
        inspired_from: seededProduct.inspired_from, // Already exists
        collection: testCollection._id.toString(),
        price: 750,
        stock: 20,
      };

      const res = await testClient.post("/api/products", payload, adminAuth.headers);

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);

      // Defect Audit: Returns 500 instead of 409
      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/duplicate key|E11000/i);
    });
  });

  describe("Missing Required Fields Schema Boundaries", () => {
    it("rejects product creation when required name is empty", async () => {
      const payload = {
        name: "",
        slug: `empty-name-${Date.now()}`,
        inspired_from: `Empty Name Source ${Date.now()}`,
        collection: testCollection._id.toString(),
        price: 750,
      };

      const res = await testClient.post("/api/products", payload, adminAuth.headers);

      expect(res.status).toBe(500); // Defect Audit: Mongoose validation error
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/name.*required/i);
    });

    it("rejects product creation when collection ObjectId is malformed", async () => {
      const payload = {
        name: "Bad Collection Fragrance",
        slug: `bad-col-${Date.now()}`,
        inspired_from: `Bad Col Source ${Date.now()}`,
        collection: "invalid-not-an-objectid",
        price: 750,
      };

      const res = await testClient.post("/api/products", payload, adminAuth.headers);

      expect(res.status).toBe(500); // Defect Audit: CastError on ObjectId
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Cast to ObjectId failed/i);
    });
  });

  describe("Product Review Rating Boundaries (400 Bad Request)", () => {
    it("rejects review submission with rating greater than 5", async () => {
      const res = await testClient.put(`/api/products/${seededProduct._id}/review`, {
        rating: 6,
        review: "Over the maximum rating bound.",
        guestName: "Boundary Reviewer",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/between 0 and 5/i);
    });

    it("rejects review submission with negative rating", async () => {
      const res = await testClient.put(`/api/products/${seededProduct._id}/review`, {
        rating: -1,
        review: "Negative rating bound.",
        guestName: "Boundary Reviewer",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/between 0 and 5/i);
    });

    it("rejects review submission with non-numeric rating string", async () => {
      const res = await testClient.put(`/api/products/${seededProduct._id}/review`, {
        rating: "five stars",
        review: "String rating test.",
        guestName: "Boundary Reviewer",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/between 0 and 5/i);
    });
  });
});
