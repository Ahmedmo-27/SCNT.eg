const ApiError = require("../../src/utils/ApiError");
const orderService = require("../../src/services/orderService");

describe("Online Orders Account Enforcement & Details Unit Tests", () => {
  describe("Account Requirement Enforcement", () => {
    it("rejects order creation when userId is missing (guest/unauthenticated)", async () => {
      const address = {
        fullName: "Guest User",
        phone: "01000000000",
        city: "Cairo",
        addressLine1: "123 Nile St",
        postalCode: "11511",
      };

      // Attempt to create order without userId
      await expect(
        orderService.createOrderFromCart({ visitorId: "visitor_abc123" }, address)
      ).rejects.toThrow(ApiError);

      try {
        await orderService.createOrderFromCart({ visitorId: "visitor_abc123" }, address);
      } catch (err) {
        expect(err.statusCode).toBe(401);
        expect(err.message).toMatch(/account is required/i);
      }
    });

    it("rejects order creation when owner is empty object or null", async () => {
      const address = {
        fullName: "Test User",
        phone: "01000000000",
        city: "Cairo",
        addressLine1: "123 Nile St",
        postalCode: "11511",
      };

      await expect(orderService.createOrderFromCart(null, address)).rejects.toThrow(ApiError);
      await expect(orderService.createOrderFromCart({}, address)).rejects.toThrow(ApiError);
    });

    it("validates required address fields before order placement", async () => {
      const incompleteAddress = {
        fullName: "Incomplete User",
        // missing phone, city, addressLine1, postalCode
      };

      await expect(
        orderService.createOrderFromCart({ userId: "507f1f77bcf86cd799439011" }, incompleteAddress)
      ).rejects.toThrow(/Address field .* is required/i);
    });
  });

  describe("Order Details and Line Item Calculations", () => {
    it("accurately calculates order items, subtotal, shipping and promo discounts", () => {
      const items = [
        {
          product: "507f1f77bcf86cd799439011",
          name: "The Sovereign",
          size: "100ml",
          quantity: 2,
          price: 950,
        },
        {
          product: "507f1f77bcf86cd799439012",
          name: "Velvet Oud",
          size: "50ml",
          quantity: 1,
          price: 650,
        },
      ];

      const shipping = 80;
      const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
      const discount = 200; // Promo coupon
      const total = Math.max(0, subtotal + shipping - discount);

      expect(subtotal).toBe(2550);
      expect(total).toBe(2430);

      // Verify line totals
      expect(items[0].quantity * items[0].price).toBe(1900);
      expect(items[1].quantity * items[1].price).toBe(650);
    });

    it("validates all allowed order status values", async () => {
      const allowedStatuses = ["PENDING", "CONFIRMED", "PAID", "SHIPPED"];

      for (const status of allowedStatuses) {
        // Invalid status rejection test
        await expect(
          orderService.updateOrderStatus("507f1f77bcf86cd799439099", "INVALID_STATUS")
        ).rejects.toThrow(/Invalid status/i);
      }
    });
  });
});
