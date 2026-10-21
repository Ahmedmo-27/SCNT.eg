const testClient = require("../helpers/testClient");
const { getAdminAuth, getUserAuth } = require("../helpers/authHelper");
const { seedTestCollection, seedTestProduct, cleanTestCollections } = require("../helpers/seedHelper");

describe("Product Domain & Excel QA Reference Suite (TC-001 through TC-005)", () => {
  let adminAuth;
  let userAuth;
  let testCollection;

  beforeAll(async () => {
    // Ensure clean baseline in test database
    await cleanTestCollections();

    // Prepare auth credentials and test collection fixture
    adminAuth = await getAdminAuth();
    userAuth = await getUserAuth();
    testCollection = await seedTestCollection();
  });

  afterAll(async () => {
    // Clean up created fixtures
    await cleanTestCollections();
  });

  // =========================================================================
  // TC-001: Admin adds new product with full details
  // =========================================================================
  describe("TC-001: Add new product as admin", () => {
    it("creates a product with complete details and verifies store visibility", async () => {
      const payload = {
        name: "Azure Horizon TC001",
        slug: "azure-horizon-tc001",
        inspired_from: "Bleu Intense TC001",
        collection: testCollection._id.toString(),
        gender: "male",
        price: 850,
        size: "100ml",
        sizes: [
          { size: "50ml", price: 500, stock: 10 },
          { size: "100ml", price: 850, stock: 25 },
        ],
        stock: 35,
        description: "Refined executive fragrance with crisp marine and woody notes.",
        topNotes: ["Bergamot", "Grapefruit", "Mint"],
        heartNotes: ["Ginger", "Nutmeg", "Jasmine"],
        baseNotes: ["Cedar", "Sandalwood", "Patchouli"],
      };

      const res = await testClient.post("/api/products", payload, adminAuth.headers);

      expect(res.status).toBe(201);
      expect(res.body).toBeDefined();
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Product created");
      expect(res.body.data).toBeDefined();
      expect(res.body.data._id).toBeDefined();
      expect(res.body.data.slug).toBe("azure-horizon-tc001");
      expect(res.body.data.price).toBe(850);
      expect(res.body.data.stock).toBe(35);

      // Verify store visibility via GET /api/products/:slug
      const detailRes = await testClient.get("/api/products/azure-horizon-tc001");
      expect(detailRes.status).toBe(200);
      expect(detailRes.body.success).toBe(true);
      expect(detailRes.body.data.name).toBe("Azure Horizon TC001");
      expect(detailRes.body.data.slug).toBe("azure-horizon-tc001");

      // Verify store visibility via search query GET /api/products?q=Azure
      const searchRes = await testClient.get("/api/products?q=Azure");
      expect(searchRes.status).toBe(200);
      expect(searchRes.body.success).toBe(true);
      expect(Array.isArray(searchRes.body.data.items)).toBe(true);
      const found = searchRes.body.data.items.find((item) => item.slug === "azure-horizon-tc001");
      expect(found).toBeDefined();
      expect(found.name).toBe("Azure Horizon TC001");
    });
  });

  // =========================================================================
  // TC-002: Add new product with invalid details
  // =========================================================================
  describe("TC-002: Add new product with invalid details", () => {
    it("rejects product with empty name and negative price", async () => {
      const invalidPayload = {
        name: "",
        slug: "invalid-tc002-empty-name",
        inspired_from: "Invalid Source TC002-A",
        collection: testCollection._id.toString(),
        price: -100,
        stock: 10,
      };

      const res = await testClient.post("/api/products", invalidPayload, adminAuth.headers);

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body).toBeDefined();
      expect(res.body.success).toBe(false);

      // Confirm product was NOT created in catalog
      const checkRes = await testClient.get("/api/products/invalid-tc002-empty-name");
      expect(checkRes.status).toBe(404);
    });

    it("rejects product creation when missing required schema fields", async () => {
      const incompletePayload = {
        description: "Only description provided without name, slug, price, or collection",
      };

      const res = await testClient.post("/api/products", incompletePayload, adminAuth.headers);

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    it("rejects product with negative stock", async () => {
      const negativeStockPayload = {
        name: "Negative Stock Fragrance",
        slug: "negative-stock-tc002",
        inspired_from: "Negative Stock Source",
        collection: testCollection._id.toString(),
        price: 750,
        stock: -15,
      };

      const res = await testClient.post("/api/products", negativeStockPayload, adminAuth.headers);

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);

      const checkRes = await testClient.get("/api/products/negative-stock-tc002");
      expect(checkRes.status).toBe(404);
    });

    it("rejects product with malformed collection ObjectId", async () => {
      const badCollectionPayload = {
        name: "Bad Collection Product",
        slug: "bad-collection-tc002",
        inspired_from: "Bad Collection Source",
        collection: "not-a-valid-objectid",
        price: 600,
        stock: 5,
      };

      const res = await testClient.post("/api/products", badCollectionPayload, adminAuth.headers);

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // TC-003: Add new product with duplicate name / duplicate slug
  // =========================================================================
  describe("TC-003: Add new product with duplicate name/slug", () => {
    it("rejects duplicate product creation when slug already exists", async () => {
      // 1. Create base product
      const basePayload = {
        name: "Duplicate Seed Product",
        slug: "duplicate-seed-tc003",
        inspired_from: "Inspiration Alpha TC003",
        collection: testCollection._id.toString(),
        price: 750,
        stock: 20,
      };

      const initialRes = await testClient.post("/api/products", basePayload, adminAuth.headers);
      expect(initialRes.status).toBe(201);

      // 2. Attempt duplicate submission with the same slug
      const duplicateSlugPayload = {
        name: "Another Product With Same Slug",
        slug: "duplicate-seed-tc003",
        inspired_from: "Different Inspiration TC003",
        collection: testCollection._id.toString(),
        price: 999,
        stock: 5,
      };

      const dupRes = await testClient.post("/api/products", duplicateSlugPayload, adminAuth.headers);

      expect(dupRes.status).toBeGreaterThanOrEqual(400);
      expect(dupRes.body.success).toBe(false);

      // 3. Confirm original product remains intact and was not overwritten
      const checkRes = await testClient.get("/api/products/duplicate-seed-tc003");
      expect(checkRes.status).toBe(200);
      expect(checkRes.body.data.price).toBe(750);
      expect(checkRes.body.data.name).toBe("Duplicate Seed Product");
    });

    it("rejects duplicate product creation when inspired_from already exists", async () => {
      const duplicateInspiredPayload = {
        name: "Different Name Unique Slug",
        slug: "unique-slug-tc003-beta",
        inspired_from: "Inspiration Alpha TC003", // Already used in previous test
        collection: testCollection._id.toString(),
        price: 800,
        stock: 10,
      };

      const res = await testClient.post("/api/products", duplicateInspiredPayload, adminAuth.headers);

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // TC-004: Add new product without logging in or without admin role
  // =========================================================================
  describe("TC-004: Add new product without logging in", () => {
    const getValidPayload = () => ({
      name: "Unauthorized Fragrance Attempt",
      slug: "unauthorized-fragrance-attempt",
      inspired_from: "Unauthorized Inspiration",
      collection: testCollection._id.toString(),
      price: 900,
      stock: 15,
    });

    it("rejects request without authorization token (401)", async () => {
      const res = await testClient.post("/api/products", getValidPayload());

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Authorization token is required/i);
    });

    it("rejects request from regular user without admin role (403)", async () => {
      const res = await testClient.post("/api/products", getValidPayload(), userAuth.headers);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Admin access required/i);
    });

    it("rejects request with forged or invalid token (401)", async () => {
      const res = await testClient.post("/api/products", getValidPayload(), {
        Authorization: "Bearer invalid.fake.token.here",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid or expired token/i);
    });

    it("rejects unauthenticated access to admin dashboard (401)", async () => {
      const res = await testClient.get("/api/admin/dashboard");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // TC-005: Add new product with valid details and image array
  // =========================================================================
  describe("TC-005: Add new product with valid details and image", () => {
    it("creates a product with image URLs and verifies image persistence in store catalog", async () => {
      const payload = {
        name: "Amber Noir TC005",
        slug: "amber-noir-tc005",
        inspired_from: "Grand Soir Maison TC005",
        collection: testCollection._id.toString(),
        gender: "male",
        price: 950,
        size: "100ml",
        sizes: [
          { size: "50ml", price: 600, stock: 10 },
          { size: "100ml", price: 950, stock: 20 },
        ],
        images: [
          "https://scnt-eg.me/images/products/amber-noir-front.webp",
          "https://scnt-eg.me/images/products/amber-noir-back.webp",
        ],
        clearBackground_Image: "https://scnt-eg.me/images/products/amber-noir-clear.webp",
        stock: 30,
        description: "Luminous benzoin and tonka bean wrapped in radiant amber.",
        topNotes: ["Spanish Labdanum"],
        heartNotes: ["Benzoin"],
        baseNotes: ["Tonka Bean", "Vanilla", "Amber"],
      };

      const res = await testClient.post("/api/products", payload, adminAuth.headers);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.images)).toBe(true);
      expect(res.body.data.images).toHaveLength(2);
      expect(res.body.data.images[0]).toBe("https://scnt-eg.me/images/products/amber-noir-front.webp");
      expect(res.body.data.clearBackground_Image).toBe("https://scnt-eg.me/images/products/amber-noir-clear.webp");

      // Verify store visibility and images via GET /api/products/:slug
      const storeRes = await testClient.get("/api/products/amber-noir-tc005");
      expect(storeRes.status).toBe(200);
      expect(storeRes.body.success).toBe(true);
      expect(storeRes.body.data.name).toBe("Amber Noir TC005");
      expect(Array.isArray(storeRes.body.data.images)).toBe(true);
      expect(storeRes.body.data.images).toHaveLength(2);
      expect(storeRes.body.data.images[0]).toBe("https://scnt-eg.me/images/products/amber-noir-front.webp");
      expect(storeRes.body.data.images[1]).toBe("https://scnt-eg.me/images/products/amber-noir-back.webp");
    });
  });

  // =========================================================================
  // Product Catalog, Search & Filtering Tests
  // =========================================================================
  describe("Product Catalog, Search & Filtering Domain", () => {
    let catalogProduct;

    beforeAll(async () => {
      catalogProduct = await seedTestProduct({
        name: "Velvet Oudh Catalog Item",
        slug: "velvet-oudh-catalog",
        inspired_from: "Oud Wood Inspired",
        collection: testCollection._id,
        gender: "male",
        price: 1100,
        topNotes: ["Cardamom", "Rosewood"],
        heartNotes: ["Oud", "Sandalwood"],
        baseNotes: ["Tonka Bean", "Amber"],
      });
    });

    it("retrieves paginated list of products", async () => {
      const res = await testClient.get("/api/products?page=1&limit=5");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(5);
      expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(1);
    });

    it("searches products via q query parameter", async () => {
      const res = await testClient.get("/api/products?q=Velvet");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      const found = res.body.data.items.find((p) => p.slug === "velvet-oudh-catalog");
      expect(found).toBeDefined();
      expect(found.name).toBe("Velvet Oudh Catalog Item");
    });

    it("filters products by fragrance note", async () => {
      const res = await testClient.get("/api/products?note=Rosewood");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      const found = res.body.data.items.find((p) => p.slug === "velvet-oudh-catalog");
      expect(found).toBeDefined();
    });

    it("filters products by gender", async () => {
      const res = await testClient.get("/api/products?gender=male");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      for (const item of res.body.data.items) {
        expect(item.gender).toBe("male");
      }
    });

    it("filters products by collection ID", async () => {
      const res = await testClient.get(`/api/products?collection=${testCollection._id.toString()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      for (const item of res.body.data.items) {
        const itemColId = item.collection?._id || item.collection || item.SCNTcollection;
        expect(itemColId.toString()).toBe(testCollection._id.toString());
      }
    });

    it("returns 404 when product slug is not found", async () => {
      const res = await testClient.get("/api/products/non-existent-perfume-slug-404");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Product not found/i);
    });
  });

  // =========================================================================
  // Product Review Submission Tests
  // =========================================================================
  describe("Product Review Submission Domain", () => {
    let reviewTargetProduct;

    beforeAll(async () => {
      reviewTargetProduct = await seedTestProduct({
        name: "Review Test Target Fragrance",
        slug: "review-test-target",
        inspired_from: "Review Target Inspiration",
        rating: 0,
        reviews: [],
      });
    });

    it("submits a valid review and updates product average rating", async () => {
      const reviewPayload = {
        rating: 4.5,
        review: "Outstanding projection and remarkable longevity!",
        guestName: "Perfume Critic",
      };

      const res = await testClient.put(
        `/api/products/${reviewTargetProduct._id.toString()}/review`,
        reviewPayload
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Review submitted");
      expect(res.body.data.reviewId).toBeDefined();
      expect(res.body.data.updatedProduct).toBeDefined();
      expect(res.body.data.updatedProduct.rating).toBe(4.5);

      // Verify the rating is persisted and reflected in product detail
      const detailRes = await testClient.get("/api/products/review-test-target");
      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.rating).toBe(4.5);
    });

    it("rejects review with rating greater than 5 (400)", async () => {
      const invalidRatingPayload = {
        rating: 6.0,
        review: "Too high rating",
        guestName: "Reviewer",
      };

      const res = await testClient.put(
        `/api/products/${reviewTargetProduct._id.toString()}/review`,
        invalidRatingPayload
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Rating must be a number between 0 and 5/i);
    });

    it("rejects review with negative rating (400)", async () => {
      const negativeRatingPayload = {
        rating: -1.0,
        review: "Negative rating",
        guestName: "Reviewer",
      };

      const res = await testClient.put(
        `/api/products/${reviewTargetProduct._id.toString()}/review`,
        negativeRatingPayload
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Rating must be a number between 0 and 5/i);
    });

    it("rejects review with empty review text (400)", async () => {
      const emptyTextPayload = {
        rating: 4,
        review: "   ",
        guestName: "Reviewer",
      };

      const res = await testClient.put(
        `/api/products/${reviewTargetProduct._id.toString()}/review`,
        emptyTextPayload
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Review must be a string/i);
    });

    it("rejects review with empty guest name (400)", async () => {
      const emptyNamePayload = {
        rating: 4,
        review: "Great fragrance!",
        guestName: "   ",
      };

      const res = await testClient.put(
        `/api/products/${reviewTargetProduct._id.toString()}/review`,
        emptyNamePayload
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Guest name is required/i);
    });

    it("returns 404 when submitting review for non-existent product ID", async () => {
      const nonExistentId = "650000000000000000000000";
      const payload = {
        rating: 4,
        review: "Non-existent target",
        guestName: "Ghost",
      };

      const res = await testClient.put(`/api/products/${nonExistentId}/review`, payload);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Product not found/i);
    });
  });

  // =========================================================================
  // Admin Product Modification & Deletion Tests
  // =========================================================================
  describe("Admin Product Modification & Deletion Domain", () => {
    let modProduct;

    beforeAll(async () => {
      modProduct = await seedTestProduct({
        name: "Modifiable Fragrance",
        slug: "modifiable-fragrance",
        inspired_from: "Modifiable Inspiration",
        price: 700,
        description: "Initial description",
      });
    });

    it("allows admin to update product price and description", async () => {
      const updatePayload = {
        price: 890,
        description: "Updated luxury description after reformulation.",
      };

      const res = await testClient.put(
        `/api/products/${modProduct._id.toString()}`,
        updatePayload,
        adminAuth.headers
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Product updated");
      expect(res.body.data.price).toBe(890);
      expect(res.body.data.description).toBe("Updated luxury description after reformulation.");
    });

    it("allows admin to delete a product and verifies it is removed from catalog", async () => {
      const deleteRes = await testClient.delete(
        `/api/products/${modProduct._id.toString()}`,
        adminAuth.headers
      );

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.message).toBe("Product deleted");

      // Verify product is no longer found via slug
      const checkRes = await testClient.get("/api/products/modifiable-fragrance");
      expect(checkRes.status).toBe(404);
    });
  });
});
