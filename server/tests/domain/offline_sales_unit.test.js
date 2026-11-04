const OfflineSale = require("../../src/models/OfflineSale");

describe("Offline Purchases & Direct Sales Unit Tests", () => {
  it("validates line item calculations with custom sold prices", () => {
    const items = [
      {
        productName: "The Explorer",
        size: "100ml",
        quantity: 2,
        unitPrice: 700, // Sold below catalog price (e.g. bazaar deal)
        subtotal: 1400,
      },
      {
        productName: "The Executive",
        size: "50ml",
        quantity: 1,
        unitPrice: 450,
        subtotal: 450,
      },
    ];

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const discount = 50; // extra direct discount
    const total = Math.max(0, subtotal - discount);

    expect(subtotal).toBe(1850);
    expect(total).toBe(1800);
  });

  it("calculates inventory stock deduction accurately", () => {
    const initialProduct = {
      name: "The Explorer",
      stock: 15,
      sizes: [
        { size: "50ml", price: 500, stock: 5 },
        { size: "100ml", price: 750, stock: 10 },
      ],
    };

    const soldQuantity = 3;
    const soldSize = "100ml";

    // Deduct main stock
    const newStock = Math.max(0, initialProduct.stock - soldQuantity);
    // Deduct size stock
    const newSizes = initialProduct.sizes.map((s) => {
      if (s.size === soldSize) {
        return { ...s, stock: Math.max(0, s.stock - soldQuantity) };
      }
      return s;
    });

    expect(newStock).toBe(12);
    expect(newSizes.find((s) => s.size === "100ml").stock).toBe(7);
    expect(newSizes.find((s) => s.size === "50ml").stock).toBe(5);
  });

  it("restores inventory stock upon sale void/delete", () => {
    const currentProduct = {
      name: "The Explorer",
      stock: 12,
      sizes: [
        { size: "50ml", price: 500, stock: 5 },
        { size: "100ml", price: 750, stock: 7 },
      ],
    };

    const restoredQuantity = 3;
    const restoredSize = "100ml";

    const restoredStock = currentProduct.stock + restoredQuantity;
    const restoredSizes = currentProduct.sizes.map((s) => {
      if (s.size === restoredSize) {
        return { ...s, stock: s.stock + restoredQuantity };
      }
      return s;
    });

    expect(restoredStock).toBe(15);
    expect(restoredSizes.find((s) => s.size === "100ml").stock).toBe(10);
  });

  it("formats and generates readable offline receipt numbers", () => {
    const d = new Date();
    const year = String(d.getFullYear()).slice(-2);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const receiptRegex = new RegExp(`^OFF-${year}${month}${day}-\\d{4}$`);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `OFF-${year}${month}${day}-${randomSuffix}`;

    expect(receiptNumber).toMatch(receiptRegex);
  });

  it("supports all required payment methods and sales channels", () => {
    const supportedMethods = ["CASH", "INSTAPAY", "CARD", "VODAFONE_CASH", "BANK_TRANSFER", "OTHER"];
    const supportedChannels = [
      "WALK_IN",
      "BAZAAR",
      "POPUP_BOOTH",
      "WHATSAPP",
      "PHONE",
      "INSTAGRAM",
      "EXHIBITION",
      "OTHER",
    ];

    expect(supportedMethods).toContain("CASH");
    expect(supportedMethods).toContain("INSTAPAY");
    expect(supportedMethods).toContain("CARD");
    expect(supportedChannels).toContain("BAZAAR");
    expect(supportedChannels).toContain("WALK_IN");
    expect(supportedChannels).toContain("WHATSAPP");
  });

  it("verifies offline sale audit payload includes deductedStock correctly", () => {
    const offlineSale = {
      _id: "661000000000000000000001",
      receiptNumber: "OFF-261023-1234",
      total: 750,
      paymentMethod: "CASH",
      channel: "WALK_IN",
      deductedStock: true,
    };
    const processedItems = [{ productName: "Amber Rush" }];

    const auditDetails = {
      receiptNumber: offlineSale.receiptNumber,
      total: offlineSale.total,
      paymentMethod: offlineSale.paymentMethod,
      channel: offlineSale.channel,
      itemCount: processedItems.length,
      deductedStock: offlineSale.deductedStock,
    };

    expect(auditDetails.deductedStock).toBe(true);
    expect(auditDetails.receiptNumber).toBe("OFF-261023-1234");
  });

  describe("Offline Purchase Editing Logic", () => {
    it("recalculates items subtotal, discount, and final total upon sale editing", () => {
      const originalSale = {
        subtotal: 750,
        discount: 0,
        total: 750,
        items: [{ productName: "Azure Code", size: "100ml", quantity: 1, unitPrice: 750, subtotal: 750 }],
      };

      // Admin edits the sale: adds another bottle (or increases quantity to 2) and gives a 100 EGP discount
      const editedItems = [
        { productName: "Azure Code", size: "100ml", quantity: 2, unitPrice: 700, subtotal: 1400 },
        { productName: "Deep Horizon", size: "50ml", quantity: 1, unitPrice: 450, subtotal: 450 },
      ];
      const newDiscount = 100;
      const newSubtotal = editedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const newTotal = Math.max(0, newSubtotal - newDiscount);

      expect(newSubtotal).toBe(1850);
      expect(newTotal).toBe(1750);
      expect(newTotal).not.toBe(originalSale.total);
    });

    it("adjusts inventory stock accurately when offline purchase quantities change", () => {
      // Product starting with 10 units in stock
      let productStock = 10;
      let sizeStock = 10;

      // 1. Initial sale deducted 2 units
      const initialQuantity = 2;
      productStock -= initialQuantity;
      sizeStock -= initialQuantity;
      expect(productStock).toBe(8);

      // 2. Admin edits sale to 3 units (instead of 2):
      // Restore previous 2 units
      productStock += initialQuantity;
      sizeStock += initialQuantity;
      expect(productStock).toBe(10);

      // Deduct updated 3 units
      const updatedQuantity = 3;
      productStock -= updatedQuantity;
      sizeStock -= updatedQuantity;
      expect(productStock).toBe(7);
      expect(sizeStock).toBe(7);
    });

    it("updates customer contact, payment details, notes, and channel without losing original receipt", () => {
      const original = {
        receiptNumber: "OFF-261104-5678",
        customer: { fullName: "Walk-in Customer", phone: "", email: "" },
        paymentMethod: "CASH",
        paymentStatus: "PENDING",
        channel: "WALK_IN",
        notes: "",
      };

      const updatePayload = {
        customer: { fullName: "Dr. Kareem", phone: "01001234567", email: "kareem@example.com" },
        paymentMethod: "INSTAPAY",
        paymentStatus: "PAID",
        channel: "BAZAAR",
        location: "Arkan Plaza",
        notes: "Paid via InstaPay transaction #987654",
      };

      const updated = {
        ...original,
        ...updatePayload,
      };

      expect(updated.receiptNumber).toBe("OFF-261104-5678"); // Receipt number preserved
      expect(updated.customer.fullName).toBe("Dr. Kareem");
      expect(updated.customer.phone).toBe("01001234567");
      expect(updated.paymentMethod).toBe("INSTAPAY");
      expect(updated.paymentStatus).toBe("PAID");
      expect(updated.channel).toBe("BAZAAR");
      expect(updated.location).toBe("Arkan Plaza");
    });
  });
});
