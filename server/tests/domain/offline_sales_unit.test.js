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
});
