const testClient = require("../helpers/testClient");
const { getAdminAuth, getUserAuth } = require("../helpers/authHelper");
const { cleanTestCollections } = require("../helpers/seedHelper");
const Expense = require("../../src/models/Expense");
const CostConfig = require("../../src/models/CostConfig");

jest.setTimeout(60000);

describe("Expenses, Materials & COGS Management Domain Test Suite", () => {
  let adminAuth;
  let userAuth;

  beforeAll(async () => {
    await cleanTestCollections();
    adminAuth = await getAdminAuth({ email: `admin.expenses.${Date.now()}@scnt.eg` });
    userAuth = await getUserAuth({ email: `user.expenses.${Date.now()}@scnt.eg` });
  });

  afterAll(async () => {
    await cleanTestCollections();
  });

  describe("Access Control", () => {
    it("rejects unauthorized access without token", async () => {
      const res = await testClient.get("/api/admin/expenses");
      expect(res.status).toBe(401);
    });

    it("rejects non-admin users with 403 Forbidden", async () => {
      const res = await testClient.get("/api/admin/expenses", {
        headers: { Authorization: `Bearer ${userAuth.token}` },
      });
      expect(res.status).toBe(403);
    });
  });

  describe("Expenses CRUD & Procurement Tracking", () => {
    let createdExpenseId;

    it("creates an expense for bottle stickers bought by the meter with auto-computed unit cost", async () => {
      const payload = {
        title: "Glossy Bottle Stickers Roll (50m)",
        category: "BOTTLE_STICKERS",
        amount: 3750, // 3750 EGP for 50 meters = 75 EGP/meter
        quantity: 50,
        unit: "meters",
        supplier: "PrintHouse Cairo",
        invoiceNumber: "INV-2026-001",
        syncWithCostConfig: true,
      };

      const res = await testClient.post("/api/admin/expenses", payload, {
        headers: { Authorization: `Bearer ${adminAuth.token}` },
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(payload.title);
      expect(res.body.data.unitCost).toBe(75);
      createdExpenseId = res.body.data._id;

      // Verify sync with CostConfig
      const cfgRes = await testClient.get("/api/admin/cost-config", {
        headers: { Authorization: `Bearer ${adminAuth.token}` },
      });
      expect(cfgRes.body.data.config.stickers.bottleStickers.costPerMeter).toBe(75);
    });

    it("creates an expense for shredded paper where 1 bag makes ~3 boxes", async () => {
      const payload = {
        title: "Black Shredded Paper Bags",
        category: "SHREDDED_PAPER",
        amount: 450, // 10 bags @ 45 EGP/bag
        quantity: 10,
        unit: "bags",
        supplier: "Packaging Store",
        syncWithCostConfig: true,
      };

      const res = await testClient.post("/api/admin/expenses", payload, {
        headers: { Authorization: `Bearer ${adminAuth.token}` },
      });

      expect(res.status).toBe(201);
      expect(res.body.data.unitCost).toBe(45);

      // Verify that shredded paper per box in CostConfig calculates costPerBag / 3 = 15 EGP
      const cfgRes = await testClient.get("/api/admin/cost-config", {
        headers: { Authorization: `Bearer ${adminAuth.token}` },
      });
      expect(cfgRes.body.data.config.wrapping.shreddedPaper.costPerBag).toBe(45);
      expect(cfgRes.body.data.config.wrapping.shreddedPaper.unitCostPerBox).toBe(15);
    });

    it("creates an expense for lab tools and alcohol", async () => {
      const beakerRes = await testClient.post(
        "/api/admin/expenses",
        {
          title: "Borosilicate 250ml Glass Beakers (Set of 3)",
          category: "LAB_TOOLS",
          amount: 320,
          quantity: 3,
          unit: "pcs",
        },
        { headers: { Authorization: `Bearer ${adminAuth.token}` } }
      );
      expect(beakerRes.status).toBe(201);

      const alcoholRes = await testClient.post(
        "/api/admin/expenses",
        {
          title: "Perfumers Alcohol 96% (5 Liters)",
          category: "FRAGRANT_ALCOHOL",
          amount: 1000,
          quantity: 5,
          unit: "liters",
          syncWithCostConfig: true,
        },
        { headers: { Authorization: `Bearer ${adminAuth.token}` } }
      );
      expect(alcoholRes.status).toBe(201);
      expect(alcoholRes.body.data.unitCost).toBe(200); // 200 EGP per liter
    });

    it("lists expenses with pagination, category filter and search", async () => {
      const res = await testClient.get("/api/admin/expenses?category=BOTTLE_STICKERS", {
        headers: { Authorization: `Bearer ${adminAuth.token}` },
      });
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.items[0].category).toBe("BOTTLE_STICKERS");

      const searchRes = await testClient.get("/api/admin/expenses?search=Beaker", {
        headers: { Authorization: `Bearer ${adminAuth.token}` },
      });
      expect(searchRes.status).toBe(200);
      expect(searchRes.body.data.items.length).toBe(1);
      expect(searchRes.body.data.items[0].category).toBe("LAB_TOOLS");
    });

    it("updates an existing expense", async () => {
      const res = await testClient.put(
        `/api/admin/expenses/${createdExpenseId}`,
        { amount: 4000, quantity: 50 },
        { headers: { Authorization: `Bearer ${adminAuth.token}` } }
      );
      expect(res.status).toBe(200);
      expect(res.body.data.amount).toBe(4000);
      expect(res.body.data.unitCost).toBe(80);
    });

    it("deletes an expense", async () => {
      const res = await testClient.delete(`/api/admin/expenses/${createdExpenseId}`, {
        headers: { Authorization: `Bearer ${adminAuth.token}` },
      });
      expect(res.status).toBe(200);

      const checkRes = await testClient.get(`/api/admin/expenses`, {
        headers: { Authorization: `Bearer ${adminAuth.token}` },
      });
      const ids = checkRes.body.data.items.map((i) => i._id);
      expect(ids).not.toContain(createdExpenseId);
    });
  });

  describe("Promotions & 3ml Decant Giveaway Quick Action", () => {
    it("logs a batch of 3ml decant giveaways with their cards as a promotional expense", async () => {
      const res = await testClient.post(
        "/api/admin/expenses/log-decant-giveaway",
        {
          count: 20,
          campaignName: "Spring Launch PR Package",
          recipient: "VIP Influencers",
          notes: "Complimentary 3ml discovery samples with Decant Cards",
        },
        { headers: { Authorization: `Bearer ${adminAuth.token}` } }
      );

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.decantUnitCost).toBeGreaterThan(0);
      expect(res.body.data.expense.category).toBe("MARKETING_GIVEAWAYS");
      expect(res.body.data.expense.promotionDetails.decantUnitsGiven).toBe(20);
      expect(res.body.data.expense.promotionDetails.campaignName).toBe("Spring Launch PR Package");
    });

    it("aggregates promotion and overall spending telemetry in getExpenseSummary", async () => {
      const res = await testClient.get("/api/admin/expenses/summary", {
        headers: { Authorization: `Bearer ${adminAuth.token}` },
      });

      expect(res.status).toBe(200);
      expect(res.body.data.totals.totalSpent).toBeGreaterThan(0);
      expect(res.body.data.totals.totalDecantsGiven).toBe(20);
      expect(res.body.data.totals.totalPromoSCS).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data.categoryBreakdown)).toBe(true);
    });
  });

  describe("CostConfig & COGS Formulas", () => {
    it("updates sticker and packaging parameters and computes accurate derived unit costs", async () => {
      const updatePayload = {
        stickers: {
          bottleStickers: { costPerMeter: 60, stickersPerMeter: 15 }, // 60 / 15 = 4 EGP
          boxSealingStickers: { costPerSheet: 40, stickersPerSheet: 20 }, // 40 / 20 = 2 EGP
          boxTopStickers: { costPerSheet: 30, stickersPerSheet: 20 }, // 30 / 20 = 1.5 EGP
        },
        cards: {
          thankYouCard: { batchCost: 300, batchQuantity: 500 }, // 0.60 EGP
          decantCard: { batchCost: 400, batchQuantity: 500 }, // 0.80 EGP
        },
        wrapping: {
          wrappingSheetUnitCost: 2.0,
          shreddedPaper: { costPerBag: 45, boxesPerBag: 3 }, // 15 EGP
          courierFlyerUnitCost: 3.0,
        },
        bottles: {
          size50ml: 25,
          size100ml: 35,
          decant3mlVial: 5,
        },
        boxes: {
          size50ml: 15,
          size100ml: 20,
        },
        liquids: {
          oilCostPerKg: 3000, // 3 EGP / ml
          oilCostPerMl: 3,
          fragrantAlcoholCostPerLiter: 200, // 0.20 EGP / ml
          fragrantAlcoholCostPerMl: 0.2,
          recipes: {
            size100ml: { oilMl: 25, alcoholMl: 75 },
            size50ml: { oilMl: 15, alcoholMl: 35 },
            decant3ml: { oilMl: 1, alcoholMl: 2 },
          },
        },
      };

      const res = await testClient.put("/api/admin/cost-config", updatePayload, {
        headers: { Authorization: `Bearer ${adminAuth.token}` },
      });

      expect(res.status).toBe(200);
      const cogs = res.body.data.cogs;

      // 1. Stickers derivation check
      expect(cogs.unitCostsSummary.bottleStickerFromMeter).toBe(4);
      expect(cogs.unitCostsSummary.boxSealingStickerFromSheet).toBe(2);
      expect(cogs.unitCostsSummary.boxTopSticker).toBe(1.5);

      // 2. Cards derivation check
      expect(cogs.unitCostsSummary.thankYouCard).toBe(0.6);
      expect(cogs.unitCostsSummary.decantCard).toBe(0.8);

      // 3. Shredded paper derivation check (45 / 3 = 15)
      expect(cogs.unitCostsSummary.shreddedPaperPerBox).toBe(15);

      // 4. 100ml Perfume COGS check:
      // Oil: 25 * 3 = 75
      // Alcohol: 75 * 0.2 = 15
      // Bottle: 35
      // Box: 20
      // Stickers: 4 + 2 + 1.5 = 7.5
      // Packaging: 2.0 (wrapping) + 15 (shredded) + 0.6 (thank you card) + 3.0 (flyer) = 20.6
      // Total 100ml = 75 + 15 + 35 + 20 + 7.5 + 20.6 = 173.1
      expect(cogs.breakdowns.size100ml.totalCogs).toBe(173.1);

      // 5. 3ml Decant Unit COGS check:
      // Liquid: 1ml oil (3) + 2ml alcohol (0.4) = 3.4
      // Decant Vial: 5
      // Decant Card: 0.8
      // Total 3ml = 3.4 + 5 + 0.8 = 9.2
      expect(cogs.breakdowns.decant3ml.totalCogs).toBe(9.2);
    });

    it("retrieves product catalog margin analysis via GET /api/admin/cogs-analysis", async () => {
      const res = await testClient.get("/api/admin/cogs-analysis", {
        headers: { Authorization: `Bearer ${adminAuth.token}` },
      });

      expect(res.status).toBe(200);
      expect(res.body.data.benchmarks).toBeDefined();
      expect(res.body.data.decant3mlAnalysis).toBeDefined();
      expect(res.body.data.decant3mlAnalysis.cogs).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data.productAnalysis)).toBe(true);
    });
  });
});
