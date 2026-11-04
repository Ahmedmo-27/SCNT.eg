const {
  computeStandardCogs,
  normalizeSize,
  buildProductCogsMap,
  calculateOutletUnitCogs,
  getItemUnitCogs,
  calculateOrdersMarginAndSales,
  calculateOfflineSalesMarginAndSales,
  calculateStorewideRevenueAndSales,
  calculateSingleOfflineSaleMarginAndCogs,
  DEFAULT_COST_CONFIG,
} = require("../../src/utils/cogsCalculator");

describe("Margin & Revenue Calculation Suite", () => {
  const sampleProducts = [
    {
      _id: "650000000000000000000001",
      name: "Azure Code",
      slug: "azure-code",
      price: 750,
      oilCostPerKg: 2000, // 2 EGP/ml
      oilCostPerMl: 2,
    },
    {
      _id: "650000000000000000000002",
      name: "Deep Horizon",
      slug: "deep-horizon",
      price: 750,
      oilCostPerKg: 5000, // 5 EGP/ml
      oilCostPerMl: 5,
    },
  ];

  describe("Size Normalization & COGS Benchmarks", () => {
    it("normalizes various size strings accurately", () => {
      expect(normalizeSize("100ml")).toBe("100ml");
      expect(normalizeSize("100 ml")).toBe("100ml");
      expect(normalizeSize("50ml")).toBe("50ml");
      expect(normalizeSize("50 ML")).toBe("50ml");
      expect(normalizeSize("3ml")).toBe("3ml");
      expect(normalizeSize("3 ml decant")).toBe("3ml");
      expect(normalizeSize(null)).toBe("100ml");
      expect(normalizeSize(undefined)).toBe("100ml");
    });

    it("precomputes product COGS map with distinct oil costs", () => {
      const { productMap, defaultSizeCogs } = buildProductCogsMap(sampleProducts, DEFAULT_COST_CONFIG);

      expect(defaultSizeCogs["100ml"]).toBeGreaterThan(0);
      expect(defaultSizeCogs["50ml"]).toBeGreaterThan(0);

      const azureCogs = productMap.get("650000000000000000000001");
      const horizonCogs = productMap.get("650000000000000000000002");

      expect(azureCogs).toBeDefined();
      expect(horizonCogs).toBeDefined();

      // Deep Horizon has oil @ 5 EGP/ml vs Azure Code @ 2 EGP/ml
      // For 100ml: 25ml oil * 5 = 125 EGP vs 25ml * 2 = 50 EGP (75 EGP difference)
      expect(horizonCogs["100ml"]).toBeGreaterThan(azureCogs["100ml"]);
      expect(horizonCogs["100ml"] - azureCogs["100ml"]).toBeCloseTo(75, 1);

      // For 50ml: 12.5g oil * 5 = 62.5 EGP vs 12.5g * 2 = 25 EGP (37.5 EGP difference)
      expect(horizonCogs["50ml"]).toBeGreaterThan(azureCogs["50ml"]);
      expect(horizonCogs["50ml"] - azureCogs["50ml"]).toBeCloseTo(37.5, 1);
    });
  });

  describe("Online Orders Fragrance Margin vs Gross Sales", () => {
    it("calculates fragrance margin accurately for full price order", () => {
      const { productMap, defaultSizeCogs } = buildProductCogsMap(sampleProducts, DEFAULT_COST_CONFIG);
      const azure100Cogs = productMap.get("650000000000000000000001")["100ml"];

      const orders = [
        {
          _id: "order_1",
          status: "CONFIRMED",
          items: [
            {
              product: "650000000000000000000001",
              size: "100ml",
              quantity: 2,
              price: 750,
            },
          ],
          subtotal: 1500,
          discount: 0,
          shipping: 50,
          total: 1550,
        },
      ];

      const result = calculateOrdersMarginAndSales(orders, productMap, defaultSizeCogs);

      // Total gross sales is order total (1550 EGP)
      expect(result.sales).toBe(1550);
      // Fragrance net sales is 1500 EGP
      expect(result.fragranceSales).toBe(1500);
      // Fragrance COGS is 2 * azure100Cogs
      expect(result.cogs).toBeCloseTo(2 * azure100Cogs, 2);
      // Margin is 1500 - (2 * azure100Cogs)
      expect(result.margin).toBeCloseTo(1500 - 2 * azure100Cogs, 2);
      // Total margin must NOT equal the gross sales number (1550)
      expect(result.margin).not.toBe(result.sales);
    });

    it("adjusts margin when promo discount is applied", () => {
      const { productMap, defaultSizeCogs } = buildProductCogsMap(sampleProducts, DEFAULT_COST_CONFIG);
      const azure100Cogs = productMap.get("650000000000000000000001")["100ml"];

      const orders = [
        {
          _id: "order_discounted",
          status: "PAID",
          items: [
            {
              product: "650000000000000000000001",
              size: "100ml",
              quantity: 1,
              price: 750,
            },
          ],
          subtotal: 750,
          discount: 100, // 100 EGP coupon
          shipping: 0,
          total: 650,
        },
      ];

      const result = calculateOrdersMarginAndSales(orders, productMap, defaultSizeCogs);

      expect(result.sales).toBe(650);
      expect(result.fragranceSales).toBe(650);
      // Margin is (750 - 100) - azure100Cogs = 650 - azure100Cogs
      expect(result.margin).toBeCloseTo(650 - azure100Cogs, 2);
    });

    it("excludes CANCELLED orders from sales and revenue", () => {
      const { productMap, defaultSizeCogs } = buildProductCogsMap(sampleProducts, DEFAULT_COST_CONFIG);

      const orders = [
        {
          _id: "order_active",
          status: "DELIVERED",
          items: [{ product: "650000000000000000000001", size: "100ml", quantity: 1, price: 750 }],
          subtotal: 750,
          discount: 0,
          total: 750,
        },
        {
          _id: "order_cancelled",
          status: "CANCELLED",
          items: [{ product: "650000000000000000000001", size: "100ml", quantity: 1, price: 750 }],
          subtotal: 750,
          discount: 0,
          total: 750,
        },
      ];

      const result = calculateOrdersMarginAndSales(orders, productMap, defaultSizeCogs);

      // Only the active order should be counted
      expect(result.sales).toBe(750);
      expect(result.fragranceSales).toBe(750);
    });
  });

  describe("Offline Purchases Margin vs Gross Sales", () => {
    it("calculates margin for custom bazaar and event pricing", () => {
      const { productMap, defaultSizeCogs } = buildProductCogsMap(sampleProducts, DEFAULT_COST_CONFIG);
      const azure100Cogs = productMap.get("650000000000000000000001")["100ml"];
      const horizon50Cogs = productMap.get("650000000000000000000002")["50ml"];

      const offlineSales = [
        {
          receiptNumber: "OFF-261104-1234",
          channel: "BAZAAR",
          items: [
            {
              product: "650000000000000000000001",
              productName: "Azure Code",
              size: "100ml",
              quantity: 2,
              unitPrice: 700,
              subtotal: 1400,
            },
            {
              product: "650000000000000000000002",
              productName: "Deep Horizon",
              size: "50ml",
              quantity: 1,
              unitPrice: 450,
              subtotal: 450,
            },
          ],
          subtotal: 1850,
          discount: 50,
          total: 1800,
        },
      ];

      const result = calculateOfflineSalesMarginAndSales(offlineSales, productMap, defaultSizeCogs);

      expect(result.sales).toBe(1800);
      expect(result.fragranceSales).toBe(1800);
      const expectedCogs = 2 * azure100Cogs + horizon50Cogs;
      expect(result.cogs).toBeCloseTo(expectedCogs, 2);
      expect(result.margin).toBeCloseTo(1800 - expectedCogs, 2);
      expect(result.totalUnits).toBe(3);

      expect(result.topProducts.length).toBe(2);
      expect(result.topProducts[0].productName).toBe("Azure Code");
      expect(result.topProducts[0].quantity).toBe(2);
    });

    it("calculates reduced COGS and increased revenue for outlet products (no box, no stickers, no packaging)", () => {
      const { productMap, defaultSizeCogs } = buildProductCogsMap(sampleProducts, DEFAULT_COST_CONFIG);
      const azure100StandardCogs = productMap.get("650000000000000000000001")["100ml"];

      const standardSale = {
        subtotal: 500,
        discount: 0,
        items: [
          {
            product: "650000000000000000000001",
            productName: "Azure Code",
            size: "100ml",
            quantity: 1,
            unitPrice: 500,
            subtotal: 500,
            isOutlet: false,
          },
        ],
      };

      const outletSale = {
        subtotal: 500,
        discount: 0,
        items: [
          {
            product: "650000000000000000000001",
            productName: "Azure Code",
            size: "100ml",
            quantity: 1,
            unitPrice: 500,
            subtotal: 500,
            isOutlet: true,
            outletDetails: {
              noBox: true,
              noBottleSticker: true,
              noBoxStickers: true,
              noPackaging: true,
            },
          },
        ],
      };

      const standardFinancials = calculateSingleOfflineSaleMarginAndCogs(standardSale, productMap, defaultSizeCogs);
      const outletFinancials = calculateSingleOfflineSaleMarginAndCogs(outletSale, productMap, defaultSizeCogs);

      // Outlet item COGS must be strictly less than standard COGS because box, stickers, and packaging are excluded
      expect(outletFinancials.cogs).toBeLessThan(standardFinancials.cogs);

      // SCNT 100ml box (22) + bottle sticker (5) + box stickers (3.875) + packaging (21.2) = 52.075 EGP savings
      const expectedSaving = 22 + 5 + 3.875 + 21.2;
      expect(standardFinancials.cogs - outletFinancials.cogs).toBeCloseTo(expectedSaving, 1);

      // Net revenue (profit) on the order increases by the packaging cost saved
      expect(outletFinancials.netRevenue).toBeGreaterThan(standardFinancials.netRevenue);
      expect(outletFinancials.netRevenue - standardFinancials.netRevenue).toBeCloseTo(expectedSaving, 1);
      expect(outletFinancials.marginPercent).toBeGreaterThan(standardFinancials.marginPercent);
    });

    it("allows selective outlet packaging exclusions (e.g. bare bottle with label, but without box)", () => {
      const { productMap, defaultSizeCogs } = buildProductCogsMap(sampleProducts, DEFAULT_COST_CONFIG);

      // Bottle kept its label (noBottleSticker = false), but sold without box or gift packaging
      const partialOutletSale = {
        subtotal: 600,
        discount: 0,
        items: [
          {
            product: "650000000000000000000001",
            productName: "Azure Code",
            size: "100ml",
            quantity: 1,
            unitPrice: 600,
            subtotal: 600,
            isOutlet: true,
            outletDetails: {
              noBox: true,
              noBottleSticker: false, // Bottle label IS included
              noBoxStickers: true,
              noPackaging: true,
            },
          },
        ],
      };

      const financials = calculateSingleOfflineSaleMarginAndCogs(partialOutletSale, productMap, defaultSizeCogs);
      const standardCogs = productMap.get("650000000000000000000001")["100ml"];

      // Deducts box (22) + box stickers (3.875) + packaging (21.2) = 47.075, keeping the 5 EGP bottle sticker
      const expectedDeduction = 22 + 3.875 + 21.2;
      expect(standardCogs - financials.cogs).toBeCloseTo(expectedDeduction, 1);
      expect(financials.items[0].isOutlet).toBe(true);
      expect(financials.items[0].unitCogs).toBeCloseTo(financials.cogs, 2);
    });
  });

  describe("Unified Storewide Revenue & Sales Aggregation", () => {
    it("correctly separates totalRevenue (margin) from totalSales (gross volume)", () => {
      const orders = [
        {
          status: "CONFIRMED",
          items: [{ product: "650000000000000000000001", size: "100ml", quantity: 1, price: 750 }],
          subtotal: 750,
          discount: 0,
          shipping: 50,
          total: 800,
        },
      ];

      const offlineSales = [
        {
          items: [
            {
              product: "650000000000000000000002",
              productName: "Deep Horizon",
              size: "100ml",
              quantity: 1,
              unitPrice: 750,
              subtotal: 750,
            },
          ],
          subtotal: 750,
          discount: 0,
          total: 750,
        },
      ];

      const summary = calculateStorewideRevenueAndSales({
        orders,
        offlineSales,
        products: sampleProducts,
        config: DEFAULT_COST_CONFIG,
      });

      // Gross total sales: 800 (online) + 750 (offline) = 1550 EGP
      expect(summary.totalSales).toBe(1550);
      expect(summary.onlineSales).toBe(800);
      expect(summary.offlineSales).toBe(750);

      // Total revenue is the actual net margin of the fragrances
      expect(summary.totalRevenue).toBeLessThan(summary.totalSales);
      expect(summary.onlineRevenue).toBeLessThan(summary.onlineSales);
      expect(summary.offlineRevenue).toBeLessThan(summary.offlineSales);

      expect(summary.totalRevenue).toBe(
        Number((summary.onlineRevenue + summary.offlineRevenue).toFixed(2))
      );
      expect(summary.marginPercent).toBeGreaterThan(0);
      expect(summary.marginPercent).toBeLessThan(100);
    });
  });
});
