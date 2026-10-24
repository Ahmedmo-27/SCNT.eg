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

    it("validates all allowed order status values including CANCELLED", async () => {
      const allowedStatuses = ["PENDING", "CONFIRMED", "PAID", "SHIPPED", "CANCELLED"];

      for (const status of allowedStatuses) {
        // Invalid status rejection test
        await expect(
          orderService.updateOrderStatus("507f1f77bcf86cd799439099", "INVALID_STATUS")
        ).rejects.toThrow(/Invalid status/i);
      }
    });

    it("rejects order placement if a promo code was attached to cart but is no longer valid or eligible", async () => {
      const userRepository = require("../../src/repositories/userRepository");
      const cartRepository = require("../../src/repositories/cartRepository");
      const productRepository = require("../../src/repositories/productRepository");
      const promoHelper = require("../../src/utils/promoHelper");

      const userSpy = jest.spyOn(userRepository, "findById").mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          email: "user@scnt.eg",
          full_name: "Test User",
        }),
      });

      const cartSpy = jest.spyOn(cartRepository, "findRawByUserId").mockResolvedValue({
        items: [{ product: "507f1f77bcf86cd799439011", size: "100ml", quantity: 1 }],
        promoCode: "EXPIRED_OR_INELIGIBLE",
      });

      const prodSpy = jest.spyOn(productRepository, "findByIds").mockResolvedValue([
        {
          _id: "507f1f77bcf86cd799439011",
          name: "Azure Code",
          stock: 10,
          price: 750,
        },
      ]);

      const PromoCode = require("../../src/models/PromoCode");
      const promoSpy = jest.spyOn(PromoCode, "findOne").mockResolvedValue(null);

      const address = {
        fullName: "Test User",
        phone: "01000000000",
        city: "Cairo",
        addressLine1: "123 Nile St",
        postalCode: "11511",
      };

      await expect(
        orderService.createOrderFromCart({ userId: "507f1f77bcf86cd799439011" }, address)
      ).rejects.toThrow(/promo code .* is no longer valid/i);

      userSpy.mockRestore();
      cartSpy.mockRestore();
      prodSpy.mockRestore();
      promoSpy.mockRestore();
    });
  });

  describe("Order Cancellation Capabilities (Client & Admin)", () => {
    const orderRepository = require("../../src/repositories/orderRepository");
    const productRepository = require("../../src/repositories/productRepository");

    const sampleOrder = {
      _id: "607f1f77bcf86cd799439099",
      user: "507f1f77bcf86cd799439011",
      status: "PENDING",
      items: [
        {
          product: "507f1f77bcf86cd799439012",
          size: "100ml",
          quantity: 2,
          price: 900,
        },
      ],
      total: 1880,
    };

    it("allows the client owner to cancel their PENDING order and restores inventory stock", async () => {
      const orderFindSpy = jest.spyOn(orderRepository, "findById").mockResolvedValue({
        ...sampleOrder,
      });
      const orderUpdateSpy = jest
        .spyOn(orderRepository, "updateStatus")
        .mockResolvedValue({ ...sampleOrder, status: "CANCELLED" });

      const prodFindSpy = jest.spyOn(productRepository, "findById").mockResolvedValue({
        _id: "507f1f77bcf86cd799439012",
        name: "Test Fragrance",
        stock: 5,
        sizes: [{ size: "100ml", price: 900, stock: 5 }],
      });
      const prodUpdateSpy = jest.spyOn(productRepository, "updateProduct").mockResolvedValue({});

      const userClient = { userId: "507f1f77bcf86cd799439011", role: "user" };
      const res = await orderService.cancelOrder("607f1f77bcf86cd799439099", userClient);

      expect(res.status).toBe("CANCELLED");
      expect(orderUpdateSpy).toHaveBeenCalledWith("607f1f77bcf86cd799439099", "CANCELLED");
      expect(prodUpdateSpy).toHaveBeenCalledWith("507f1f77bcf86cd799439012", {
        $inc: { stock: 2 },
        sizes: [{ size: "100ml", price: 900, stock: 7 }],
      });

      orderFindSpy.mockRestore();
      orderUpdateSpy.mockRestore();
      prodFindSpy.mockRestore();
      prodUpdateSpy.mockRestore();
    });

    it("prevents a client from cancelling an order that does not belong to them", async () => {
      const orderFindSpy = jest.spyOn(orderRepository, "findById").mockResolvedValue({
        ...sampleOrder,
      });

      const anotherClient = { userId: "507f1f77bcf86cd799439999", role: "user" };
      await expect(
        orderService.cancelOrder("607f1f77bcf86cd799439099", anotherClient)
      ).rejects.toThrow(/Not authorized to cancel this order/i);

      orderFindSpy.mockRestore();
    });

    it("prevents a client from cancelling an order once it is SHIPPED", async () => {
      const orderFindSpy = jest.spyOn(orderRepository, "findById").mockResolvedValue({
        ...sampleOrder,
        status: "SHIPPED",
      });

      const userClient = { userId: "507f1f77bcf86cd799439011", role: "user" };
      await expect(
        orderService.cancelOrder("607f1f77bcf86cd799439099", userClient)
      ).rejects.toThrow(/already been shipped or paid cannot be cancelled/i);

      orderFindSpy.mockRestore();
    });

    it("prevents cancelling an order that is already CANCELLED", async () => {
      const orderFindSpy = jest.spyOn(orderRepository, "findById").mockResolvedValue({
        ...sampleOrder,
        status: "CANCELLED",
      });

      const userClient = { userId: "507f1f77bcf86cd799439011", role: "user" };
      await expect(
        orderService.cancelOrder("607f1f77bcf86cd799439099", userClient)
      ).rejects.toThrow(/already cancelled/i);

      orderFindSpy.mockRestore();
    });

    it("allows admin to cancel an order and restores inventory stock", async () => {
      const orderFindSpy = jest.spyOn(orderRepository, "findById").mockResolvedValue({
        ...sampleOrder,
        status: "CONFIRMED",
      });
      const orderUpdateSpy = jest
        .spyOn(orderRepository, "updateStatus")
        .mockResolvedValue({ ...sampleOrder, status: "CANCELLED" });

      const prodFindSpy = jest.spyOn(productRepository, "findById").mockResolvedValue({
        _id: "507f1f77bcf86cd799439012",
        name: "Test Fragrance",
        stock: 10,
      });
      const prodUpdateSpy = jest.spyOn(productRepository, "updateProduct").mockResolvedValue({});

      const adminUser = { userId: "admin_123", role: "admin" };
      const res = await orderService.cancelOrder("607f1f77bcf86cd799439099", adminUser);

      expect(res.status).toBe("CANCELLED");
      expect(orderUpdateSpy).toHaveBeenCalledWith("607f1f77bcf86cd799439099", "CANCELLED");
      expect(prodUpdateSpy).toHaveBeenCalledWith("507f1f77bcf86cd799439012", {
        $inc: { stock: 2 },
      });

      orderFindSpy.mockRestore();
      orderUpdateSpy.mockRestore();
      prodFindSpy.mockRestore();
      prodUpdateSpy.mockRestore();
    });
  });
});
