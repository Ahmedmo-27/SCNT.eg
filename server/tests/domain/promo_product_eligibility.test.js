const mongoose = require("mongoose");
const {
  calculateEligibleSubtotal,
  isPromoApplicableToCart,
  calculateDiscount,
  hasProductRestrictions,
} = require("../../src/utils/promoHelper");

describe("Product and Size Specific Promo Codes with Count Limits & Scopes", () => {
  const azureCodeId = new mongoose.Types.ObjectId().toString();
  const deepHorizonId = new mongoose.Types.ObjectId().toString();
  const otherProductId = new mongoose.Types.ObjectId().toString();

  const productMap = new Map([
    [
      azureCodeId,
      {
        _id: azureCodeId,
        name: "Azure Code",
        price: 800,
        sizes: [
          { size: "50ml", price: 500 },
          { size: "100ml", price: 800 },
        ],
      },
    ],
    [
      deepHorizonId,
      {
        _id: deepHorizonId,
        name: "Deep Horizon",
        price: 750,
        sizes: [
          { size: "50ml", price: 450 },
          { size: "100ml", price: 750 },
        ],
      },
    ],
    [
      otherProductId,
      {
        _id: otherProductId,
        name: "Noir Velvet",
        price: 600,
        sizes: [
          { size: "50ml", price: 400 },
          { size: "100ml", price: 600 },
        ],
      },
    ],
  ]);

  const targetPromo = {
    code: "SPECIAL20",
    discountType: "PERCENTAGE",
    discountValue: 20, // 20%
    isActive: true,
    applicableProducts: [
      { product: azureCodeId, maxCount: 2 }, // Azure Code twice
      { product: deepHorizonId, maxCount: 1 }, // Deep Horizon once
    ],
  };

  describe("Product restrictions detection", () => {
    it("recognizes product-specific promos", () => {
      expect(hasProductRestrictions(targetPromo)).toBe(true);
      expect(hasProductRestrictions({ code: "ALL", applicableProducts: [] })).toBe(false);
      expect(hasProductRestrictions({ code: "ALL" })).toBe(false);
    });

    it("recognizes size-restricted promos", () => {
      expect(hasProductRestrictions({ code: "SIZEONLY", applicableSizes: ["50ml"] })).toBe(true);
    });
  });

  describe("Cart eligibility verification", () => {
    it("rejects promo when cart contains only non-eligible products", () => {
      const items = [{ product: otherProductId, quantity: 2, size: "100ml" }];
      expect(isPromoApplicableToCart(targetPromo, items)).toBe(false);
    });

    it("accepts promo when cart contains at least one eligible product", () => {
      const items = [
        { product: otherProductId, quantity: 1, size: "100ml" },
        { product: azureCodeId, quantity: 1, size: "100ml" },
      ];
      expect(isPromoApplicableToCart(targetPromo, items)).toBe(true);
    });

    it("accepts storewide promos for any non-empty cart", () => {
      const storewidePromo = { code: "STOREWIDE", applicableProducts: [] };
      const items = [{ product: otherProductId, quantity: 1, size: "100ml" }];
      expect(isPromoApplicableToCart(storewidePromo, items)).toBe(true);
    });
  });

  describe("Eligible subtotal and count limit calculations", () => {
    it("calculates eligible subtotal capped at item counts (Azure Code twice, Deep Horizon once)", () => {
      // Cart: 3 Azure Code (100ml @ 800), 2 Deep Horizon (100ml @ 750), 1 Noir (100ml @ 600)
      const items = [
        { product: azureCodeId, quantity: 3, size: "100ml" },
        { product: deepHorizonId, quantity: 2, size: "100ml" },
        { product: otherProductId, quantity: 1, size: "100ml" },
      ];

      // Total cart subtotal = 3*800 + 2*750 + 600 = 2400 + 1500 + 600 = 4500
      const subtotal = 4500;

      // Eligible:
      // Azure Code: capped at 2 units -> 2 * 800 = 1600
      // Deep Horizon: capped at 1 unit -> 1 * 750 = 750
      // Noir: 0
      // Total eligible subtotal = 1600 + 750 = 2350
      const eligibleSubtotal = calculateEligibleSubtotal(targetPromo, items, productMap);
      expect(eligibleSubtotal).toBe(2350);

      // 20% discount on 2350 = 470
      const discount = calculateDiscount(targetPromo, subtotal, items, productMap);
      expect(discount).toBe(470);
    });

    it("prioritizes higher priced sizes when applying count limits", () => {
      // Cart: 1 Azure Code 100ml (@ 800) and 2 Azure Code 50ml (@ 500). Max count is 2.
      const items = [
        { product: azureCodeId, quantity: 1, size: "100ml" },
        { product: azureCodeId, quantity: 2, size: "50ml" },
      ];

      // Eligible: 1x 800 + 1x 500 = 1300 (second 50ml unit is excluded)
      const eligibleSubtotal = calculateEligibleSubtotal(targetPromo, items, productMap);
      expect(eligibleSubtotal).toBe(1300);

      // Subtotal = 800 + 1000 = 1800. 20% on 1300 = 260
      const discount = calculateDiscount(targetPromo, 1800, items, productMap);
      expect(discount).toBe(260);
    });

    it("discounts only up to cart quantity if cart has fewer than max count", () => {
      // Cart has only 1 Azure Code (100ml @ 800) and no Deep Horizon
      const items = [{ product: azureCodeId, quantity: 1, size: "100ml" }];
      const eligibleSubtotal = calculateEligibleSubtotal(targetPromo, items, productMap);
      expect(eligibleSubtotal).toBe(800);

      // 20% of 800 = 160
      const discount = calculateDiscount(targetPromo, 800, items, productMap);
      expect(discount).toBe(160);
    });

    it("returns 0 discount if no eligible products are in the cart", () => {
      const items = [{ product: otherProductId, quantity: 2, size: "100ml" }];
      const discount = calculateDiscount(targetPromo, 1200, items, productMap);
      expect(discount).toBe(0);
    });

    it("caps discount when maxDiscount is set", () => {
      const promoWithCap = {
        ...targetPromo,
        maxDiscount: 300,
      };
      const items = [
        { product: azureCodeId, quantity: 2, size: "100ml" }, // 1600
        { product: deepHorizonId, quantity: 1, size: "100ml" }, // 750
      ]; // eligible = 2350, 20% = 470 -> capped at 300

      const discount = calculateDiscount(promoWithCap, 2350, items, productMap);
      expect(discount).toBe(300);
    });

    it("handles FIXED discount without exceeding eligible subtotal", () => {
      const fixedPromo = {
        code: "FIXED100",
        discountType: "FIXED",
        discountValue: 100, // EGP 100
        isActive: true,
        applicableProducts: [{ product: azureCodeId, maxCount: 2 }],
      };

      const items = [{ product: azureCodeId, quantity: 1, size: "100ml" }]; // 800
      const discount = calculateDiscount(fixedPromo, 800, items, productMap);
      expect(discount).toBe(100);

      // Test small eligible subtotal: discount cannot exceed eligible items subtotal
      const smallMap = new Map([
        [azureCodeId, { _id: azureCodeId, name: "Sample", price: 40 }],
      ]);
      const smallItems = [{ product: azureCodeId, quantity: 1, price: 40 }];
      const cappedFixed = calculateDiscount(fixedPromo, 40, smallItems, smallMap);
      expect(cappedFixed).toBe(40);
    });

    it("handles unlimited units for a product when maxCount is null", () => {
      const unlimitedPromo = {
        code: "UNLIMITEDAZURE",
        discountType: "PERCENTAGE",
        discountValue: 10,
        applicableProducts: [{ product: azureCodeId, maxCount: null }],
      };

      const items = [{ product: azureCodeId, quantity: 5, size: "100ml" }]; // 5 * 800 = 4000
      const eligibleSubtotal = calculateEligibleSubtotal(unlimitedPromo, items, productMap);
      expect(eligibleSubtotal).toBe(4000);

      const discount = calculateDiscount(unlimitedPromo, 4000, items, productMap);
      expect(discount).toBe(400); // 10% of 4000
    });
  });

  describe("Size-Specific Restrictions", () => {
    it("restricts eligibility to specific size for a product (e.g. Azure Code 100ml only)", () => {
      const sizeRestrictedPromo = {
        code: "AZURE100ONLY",
        discountType: "PERCENTAGE",
        discountValue: 20,
        applicableProducts: [
          { product: azureCodeId, sizes: ["100ml"], maxCount: 2 },
        ],
      };

      // Cart with 1x 100ml Azure Code (@ 800) and 2x 50ml Azure Code (@ 500)
      const items = [
        { product: azureCodeId, quantity: 1, size: "100ml" },
        { product: azureCodeId, quantity: 2, size: "50ml" },
      ];

      // Only the 100ml unit qualifies, 50ml units are excluded!
      const eligible = calculateEligibleSubtotal(sizeRestrictedPromo, items, productMap);
      expect(eligible).toBe(800);

      const discount = calculateDiscount(sizeRestrictedPromo, 1800, items, productMap);
      expect(discount).toBe(160); // 20% of 800
    });

    it("rejects promo when cart only contains non-qualifying size of eligible product", () => {
      const sizeRestrictedPromo = {
        code: "AZURE100ONLY",
        discountType: "PERCENTAGE",
        discountValue: 20,
        applicableProducts: [
          { product: azureCodeId, sizes: ["100ml"], maxCount: 2 },
        ],
      };

      const items = [{ product: azureCodeId, quantity: 2, size: "50ml" }];
      expect(isPromoApplicableToCart(sizeRestrictedPromo, items)).toBe(false);

      const eligible = calculateEligibleSubtotal(sizeRestrictedPromo, items, productMap);
      expect(eligible).toBe(0);
    });

    it("applies storewide size filter across all products (e.g. 50ml only)", () => {
      const storewide50mlPromo = {
        code: "50MLONLY",
        discountType: "PERCENTAGE",
        discountValue: 15,
        applicableSizes: ["50ml"],
      };

      const items = [
        { product: azureCodeId, quantity: 1, size: "100ml" }, // 800 (excluded)
        { product: deepHorizonId, quantity: 1, size: "50ml" }, // 450 (eligible)
        { product: otherProductId, quantity: 1, size: "50ml" }, // 400 (eligible)
      ];

      // Eligible: 450 + 400 = 850
      const eligible = calculateEligibleSubtotal(storewide50mlPromo, items, productMap);
      expect(eligible).toBe(850);

      const discount = calculateDiscount(storewide50mlPromo, 1650, items, productMap);
      expect(discount).toBe((850 * 15) / 100); // 127.5
    });
  });

  describe("Whole Cart vs Certain Products Scope", () => {
    it("applies discount to WHOLE CART subtotal once eligible item is present", () => {
      const wholeCartPromo = {
        code: "BUYAZURE_SAVECART",
        discountType: "PERCENTAGE",
        discountValue: 10, // 10%
        discountScope: "WHOLE_CART",
        applicableProducts: [
          { product: azureCodeId, maxCount: 1, sizes: ["100ml"] },
        ],
      };

      // Cart with 1 Azure Code 100ml (@ 800) + 1 Deep Horizon 100ml (@ 750) + 1 Noir (@ 600) = 2150
      const items = [
        { product: azureCodeId, quantity: 1, size: "100ml" },
        { product: deepHorizonId, quantity: 1, size: "100ml" },
        { product: otherProductId, quantity: 1, size: "100ml" },
      ];

      // Because discountScope is WHOLE_CART, entire subtotal (2150) is discounted!
      const eligible = calculateEligibleSubtotal(wholeCartPromo, items, productMap);
      expect(eligible).toBe(2150);

      const discount = calculateDiscount(wholeCartPromo, 2150, items, productMap);
      expect(discount).toBe(215); // 10% of 2150
    });

    it("restricts discount to CERTAIN PRODUCTS only when discountScope is CERTAIN_PRODUCTS", () => {
      const certainProductsPromo = {
        code: "BUYAZURE_SAVEAZURE",
        discountType: "PERCENTAGE",
        discountValue: 10, // 10%
        discountScope: "CERTAIN_PRODUCTS",
        applicableProducts: [
          { product: azureCodeId, maxCount: 1, sizes: ["100ml"] },
        ],
      };

      const items = [
        { product: azureCodeId, quantity: 1, size: "100ml" }, // 800 (eligible)
        { product: deepHorizonId, quantity: 1, size: "100ml" }, // 750 (not eligible)
        { product: otherProductId, quantity: 1, size: "100ml" }, // 600 (not eligible)
      ];

      // Only Azure Code 100ml (800) is discounted
      const eligible = calculateEligibleSubtotal(certainProductsPromo, items, productMap);
      expect(eligible).toBe(800);

      const discount = calculateDiscount(certainProductsPromo, 2150, items, productMap);
      expect(discount).toBe(80); // 10% of 800
    });

    it("gives 0 discount for WHOLE_CART promo if required item is absent", () => {
      const wholeCartPromo = {
        code: "BUYAZURE_SAVECART",
        discountType: "PERCENTAGE",
        discountValue: 10,
        discountScope: "WHOLE_CART",
        applicableProducts: [
          { product: azureCodeId, maxCount: 1, sizes: ["100ml"] },
        ],
      };

      const items = [
        { product: deepHorizonId, quantity: 1, size: "100ml" },
        { product: otherProductId, quantity: 1, size: "100ml" },
      ];

      expect(isPromoApplicableToCart(wholeCartPromo, items)).toBe(false);
      const eligible = calculateEligibleSubtotal(wholeCartPromo, items, productMap);
      expect(eligible).toBe(0);

      const discount = calculateDiscount(wholeCartPromo, 1350, items, productMap);
      expect(discount).toBe(0);
    });
  });
});
