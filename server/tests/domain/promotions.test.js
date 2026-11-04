const testClient = require("../helpers/testClient");
const { getAdminAuth, getUserAuth } = require("../helpers/authHelper");
const { cleanTestCollections } = require("../helpers/seedHelper");
const PromotionCampaign = require("../../src/models/PromotionCampaign");
const PromotionLead = require("../../src/models/PromotionLead");
const PromoCode = require("../../src/models/PromoCode");
const { deleteCache } = require("../../src/utils/cache");

describe("Promotions, Scheduled Campaigns & Visitor Lead Capture Domain Suite", () => {
  let adminAuth;
  let userAuth;

  beforeAll(async () => {
    await cleanTestCollections();
    adminAuth = await getAdminAuth({ email: `admin.promos.${Date.now()}@scnt.eg` });
    userAuth = await getUserAuth({ email: `user.promos.${Date.now()}@scnt.eg` });
  });

  beforeEach(async () => {
    await PromotionCampaign.deleteMany({});
    await PromotionLead.deleteMany({});
    await PromoCode.deleteMany({});
    await deleteCache("promotions:active");
    await deleteCache("admin:promoCodes:all");
  });

  afterAll(async () => {
    await cleanTestCollections();
  });

  describe("Public Active Promotion Resolution (/api/promotions/active)", () => {
    it("returns null when no promotions exist", async () => {
      const res = await testClient.get("/api/promotions/active");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeNull();
    });

    it("returns DEFAULT_WELCOME campaign during normal times", async () => {
      await PromotionCampaign.create({
        name: "Welcome 10% First Order",
        type: "DEFAULT_WELCOME",
        title: { en: "Welcome to SCNT", ar: "أهلاً بك في SCNT" },
        subtitle: { en: "Get 10% off your first bottle", ar: "احصل على خصم 10% على أول زجاجة" },
        promoCode: "FIRST10",
        discountType: "PERCENTAGE",
        discountValue: 10,
        discountHighlight: { en: "10% OFF", ar: "خصم 10%" },
        isActive: true,
        showModal: true,
      });

      const res = await testClient.get("/api/promotions/active");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe("Welcome 10% First Order");
      expect(res.body.data.type).toBe("DEFAULT_WELCOME");
      expect(res.body.data.title.en).toBe("Welcome to SCNT");
      // Security check: raw promo code must NOT be leaked prior to email claim
      expect(res.body.data.promoCode).toBeUndefined();
    });

    it("prioritizes active SPECIAL_EVENT (e.g. Black Friday) when within the schedule period", async () => {
      const now = Date.now();

      // 1. Evergreen Default Welcome
      await PromotionCampaign.create({
        name: "Normal Times Welcome",
        type: "DEFAULT_WELCOME",
        title: { en: "Welcome 10%", ar: "أهلاً بك 10%" },
        promoCode: "WELCOME10",
        discountValue: 10,
        isActive: true,
        showModal: true,
      });

      // 2. Active Black Friday Special Event
      await PromotionCampaign.create({
        name: "Black Friday Sale 2026",
        type: "SPECIAL_EVENT",
        title: { en: "Black Friday Exclusive", ar: "عروض الجمعة البيضاء الحصرية" },
        subtitle: { en: "25% off all collections", ar: "خصم 25% على كل التشكيلات" },
        promoCode: "BF25",
        discountValue: 25,
        discountHighlight: { en: "25% OFF", ar: "خصم 25%" },
        startsAt: new Date(now - 3600000), // Started 1 hour ago
        expiresAt: new Date(now + 86400000), // Ends tomorrow
        isActive: true,
        showModal: true,
        theme: "black_friday",
      });

      const res = await testClient.get("/api/promotions/active");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Black Friday Sale 2026");
      expect(res.body.data.type).toBe("SPECIAL_EVENT");
      expect(res.body.data.discountHighlight.en).toBe("25% OFF");
      expect(res.body.data.theme).toBe("black_friday");
      expect(res.body.data.promoCode).toBeUndefined();
    });

    it("falls back to DEFAULT_WELCOME when SPECIAL_EVENT is outside its date window (expired or future)", async () => {
      const now = Date.now();

      // Evergreen Default Welcome
      await PromotionCampaign.create({
        name: "Default Welcome",
        type: "DEFAULT_WELCOME",
        title: { en: "Standard Welcome", ar: "ترحيب قياسي" },
        promoCode: "STD10",
        discountValue: 10,
        isActive: true,
        showModal: true,
      });

      // Expired Black Friday
      await PromotionCampaign.create({
        name: "Expired Black Friday",
        type: "SPECIAL_EVENT",
        title: { en: "Old Black Friday", ar: "جمعة بيضاء قديمة" },
        promoCode: "EXPIRED_BF",
        discountValue: 30,
        startsAt: new Date(now - 7 * 86400000),
        expiresAt: new Date(now - 2 * 86400000),
        isActive: true,
        showModal: true,
      });

      // Future Eid Sale
      await PromotionCampaign.create({
        name: "Future Eid Sale",
        type: "SPECIAL_EVENT",
        title: { en: "Future Eid", ar: "عيد قادم" },
        promoCode: "FUTURE_EID",
        discountValue: 20,
        startsAt: new Date(now + 5 * 86400000),
        expiresAt: new Date(now + 10 * 86400000),
        isActive: true,
        showModal: true,
      });

      const res = await testClient.get("/api/promotions/active");
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Default Welcome");
      expect(res.body.data.type).toBe("DEFAULT_WELCOME");
    });
  });

  describe("Visitor Email Lead Capture & Promo Delivery (/api/promotions/claim)", () => {
    let testCampaign;

    beforeEach(async () => {
      testCampaign = await PromotionCampaign.create({
        name: "Black Friday Launch",
        type: "SPECIAL_EVENT",
        title: { en: "Black Friday Private Pass", ar: "تذكرة الجمعة البيضاء الخاصة" },
        subtitle: { en: "Enter your email to receive 20% off", ar: "أدخل بريدك الإلكتروني للحصول على خصم 20%" },
        promoCode: "BF2026",
        discountType: "PERCENTAGE",
        discountValue: 20,
        discountHighlight: { en: "20% OFF", ar: "خصم 20%" },
        startsAt: new Date(Date.now() - 3600000),
        expiresAt: new Date(Date.now() + 86400000),
        isActive: true,
        showModal: true,
      });
    });

    it("rejects invalid or missing email address", async () => {
      const res = await testClient.post("/api/promotions/claim", {
        campaignId: testCampaign._id.toString(),
        email: "not-an-email",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("valid email");
    });

    it("successfully claims promotion, captures lead, and returns promoCode", async () => {
      const targetEmail = `visitor.${Date.now()}@example.com`;

      const res = await testClient.post(
        "/api/promotions/claim",
        {
          campaignId: testCampaign._id.toString(),
          email: targetEmail,
          locale: "en",
        },
        { "x-visitor-id": "vid_test_123" }
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.promoCode).toBe("BF2026");
      expect(res.body.data.discountValue).toBe(20);

      // Verify database lead record was saved
      const savedLead = await PromotionLead.findOne({
        campaign: testCampaign._id,
        email: targetEmail,
      });

      expect(savedLead).not.toBeNull();
      expect(savedLead.promoCode).toBe("BF2026");
      expect(savedLead.visitorId).toBe("vid_test_123");
    });

    it("gracefully updates existing lead on repeated submissions without error", async () => {
      const targetEmail = `repeat.visitor@example.com`;

      const res1 = await testClient.post("/api/promotions/claim", {
        campaignId: testCampaign._id.toString(),
        email: targetEmail,
      });
      expect(res1.status).toBe(200);

      const res2 = await testClient.post("/api/promotions/claim", {
        campaignId: testCampaign._id.toString(),
        email: targetEmail,
      });
      expect(res2.status).toBe(200);

      const leadCount = await PromotionLead.countDocuments({
        campaign: testCampaign._id,
        email: targetEmail,
      });
      expect(leadCount).toBe(1);
    });
  });

  describe("Admin Campaign Management Suite (/api/admin/promotions)", () => {
    it("denies unauthenticated users", async () => {
      const res = await testClient.get("/api/admin/promotions");
      expect(res.status).toBe(401);
    });

    it("denies regular customers without admin role", async () => {
      const res = await testClient.get("/api/admin/promotions", {
        Authorization: `Bearer ${userAuth.token}`,
      });
      expect(res.status).toBe(403);
    });

    it("creates a promotional campaign and syncs underlying PromoCode", async () => {
      const res = await testClient.post(
        "/api/admin/promotions",
        {
          name: "Cyber Monday 2026",
          type: "SPECIAL_EVENT",
          title: { en: "Cyber Monday Deal", ar: "عرض إثنين الإنترنت" },
          subtitle: { en: "30% off all extracts", ar: "خصم 30% على كل العطور" },
          promoCode: "CYBER30",
          discountType: "PERCENTAGE",
          discountValue: 30,
          minSubtotal: 1000,
          startsAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          isActive: true,
          showModal: true,
          theme: "black_friday",
        },
        { Authorization: `Bearer ${adminAuth.token}` }
      );

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.promoCode).toBe("CYBER30");

      // Verify underlying PromoCode was created and synced
      const syncedPromo = await PromoCode.findOne({ code: "CYBER30" });
      expect(syncedPromo).not.toBeNull();
      expect(syncedPromo.discountValue).toBe(30);
      expect(syncedPromo.minSubtotal).toBe(1000);
      expect(syncedPromo.isActive).toBe(true);
    });

    it("lists campaigns with aggregated lead counts", async () => {
      const campaign = await PromotionCampaign.create({
        name: "Test List Campaign",
        type: "DEFAULT_WELCOME",
        title: { en: "Title", ar: "عنوان" },
        promoCode: "LIST10",
        discountValue: 10,
        isActive: true,
      });

      // Insert 2 leads
      await PromotionLead.create([
        { campaign: campaign._id, email: "lead1@example.com", promoCode: "LIST10" },
        { campaign: campaign._id, email: "lead2@example.com", promoCode: "LIST10" },
      ]);

      const res = await testClient.get("/api/admin/promotions", {
        Authorization: `Bearer ${adminAuth.token}`,
      });

      expect(res.status).toBe(200);
      const found = res.body.data.find((c) => c._id === campaign._id.toString());
      expect(found).toBeDefined();
      expect(found.leadsCount).toBe(2);
    });

    it("updates a campaign and syncs updated promo parameters", async () => {
      const campaign = await PromotionCampaign.create({
        name: "Pre-Update Campaign",
        type: "SPECIAL_EVENT",
        title: { en: "Pre Title", ar: "قبل التحديث" },
        promoCode: "PRE15",
        discountValue: 15,
        isActive: true,
      });

      const res = await testClient.put(
        `/api/admin/promotions/${campaign._id}`,
        {
          title: { en: "Updated Title", ar: "عنوان محدث" },
          discountValue: 20,
        },
        { Authorization: `Bearer ${adminAuth.token}` }
      );

      expect(res.status).toBe(200);
      expect(res.body.data.discountValue).toBe(20);

      const syncedPromo = await PromoCode.findOne({ code: "PRE15" });
      expect(syncedPromo.discountValue).toBe(20);
    });

    it("deletes a promotional campaign", async () => {
      const campaign = await PromotionCampaign.create({
        name: "To Delete",
        title: { en: "Del", ar: "حذف" },
        promoCode: "DEL10",
        discountValue: 10,
      });

      const res = await testClient.del(`/api/admin/promotions/${campaign._id}`, {
        Authorization: `Bearer ${adminAuth.token}`,
      });

      expect(res.status).toBe(200);
      const exists = await PromotionCampaign.findById(campaign._id);
      expect(exists).toBeNull();
    });

    it("retrieves leads for a specific campaign", async () => {
      const campaign = await PromotionCampaign.create({
        name: "Leads Test Campaign",
        title: { en: "Leads Test", ar: "فحص القائمة" },
        promoCode: "LEADSTEST",
        discountValue: 15,
      });

      await PromotionLead.create({
        campaign: campaign._id,
        email: "customer@scnt.eg",
        promoCode: "LEADSTEST",
        locale: "ar",
      });

      const res = await testClient.get(`/api/admin/promotions/${campaign._id}/leads`, {
        Authorization: `Bearer ${adminAuth.token}`,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.totalCount).toBe(1);
      expect(res.body.data.leads[0].email).toBe("customer@scnt.eg");
    });
  });
});
