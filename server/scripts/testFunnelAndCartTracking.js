const assert = require("assert");
const mongoose = require("mongoose");
const connectDb = require("../src/config/db");
const Cart = require("../src/models/Cart");
const Visit = require("../src/models/Visit");
const PromoCode = require("../src/models/PromoCode");
const Order = require("../src/models/Order");
const User = require("../src/models/User");
const Product = require("../src/models/Product");
const cartRepository = require("../src/repositories/cartRepository");
const cartService = require("../src/services/cartService");
const analyticsController = require("../src/controllers/analyticsController");

async function runTests() {
  console.log("=== Starting Automated Funnel, Cart & Coupon Tracking Verification ===");

  await connectDb();
  console.log("✓ Connected to database");

  // Ensure legacy Cart user_1 index is migrated to sparse index
  try {
    const indexes = await Cart.collection.indexes();
    const userIdx = indexes.find((i) => i.name === "user_1");
    if (userIdx && !userIdx.sparse) {
      await Cart.collection.dropIndex("user_1");
      await Cart.syncIndexes();
      console.log("✓ Migrated Cart user_1 index to sparse index");
    }
  } catch (err) {
    // ignore
  }

  const testSuffix = Date.now().toString(36);
  const testVisitorId = `test_vid_${testSuffix}`;
  const testSessionId = `test_sid_${testSuffix}`;

  try {
    // 1. Verify a Product exists for testing
    let testProduct = await Product.findOne({});
    if (!testProduct) {
      testProduct = await Product.create({
        name: `Test Fragrance ${testSuffix}`,
        slug: `test-fragrance-${testSuffix}`,
        price: 950,
        stock: 50,
        description: "Test perfume for tracking",
      });
      console.log("✓ Created fallback test product");
    } else {
      console.log(`✓ Using test product: ${testProduct.name} (${testProduct._id})`);
    }

    // 2. Test Guest Cart Operations (creation, item add, promo apply)
    console.log("\n--- 2. Testing Guest Cart Flow ---");
    const guestOwner = { visitorId: testVisitorId, sessionId: testSessionId };

    const initialCart = await cartService.getCart(guestOwner);
    assert.strictEqual(initialCart.items.length, 0, "Guest cart should initially be empty");
    assert.strictEqual(initialCart.visitorId, testVisitorId, "Cart visitorId should match");
    console.log("✓ Guest cart initialized empty");

    const cartAfterAdd = await cartService.addItem(guestOwner, testProduct._id.toString(), 2, "100ml");
    assert.strictEqual(cartAfterAdd.items.length, 1, "Should have 1 item in guest cart");
    assert.strictEqual(cartAfterAdd.items[0].quantity, 2, "Item quantity should be 2");
    console.log("✓ Item added to guest cart (qty: 2)");

    // 3. Test Active Carts Query
    console.log("\n--- 3. Testing Active Carts Listing ---");
    const activeCartsResult = await cartRepository.findAllCartsWithItems({ status: "all", limit: 50 });
    assert.ok(activeCartsResult.total >= 1, "Should find at least 1 open cart with items");
    const foundGuestCart = activeCartsResult.carts.find((c) => c.visitorId === testVisitorId);
    assert.ok(foundGuestCart, "Should find our test guest cart in active carts query");
    assert.strictEqual(foundGuestCart.items.length, 1, "Found cart should have 1 item");
    console.log(`✓ Active carts query verified (Found ${activeCartsResult.total} active carts)`);

    // 4. Test Funnel Stage & Action Logging in Visit
    console.log("\n--- 4. Testing Funnel Milestones in Visit Model ---");
    const visit1 = await Visit.create({
      visitorId: testVisitorId,
      sessionId: testSessionId,
      path: "/",
      title: "Home",
      stage: "browse",
      action: "pageview",
    });
    assert.strictEqual(visit1.stage, "browse", "Visit stage should be browse");

    const visit2 = await Visit.create({
      visitorId: testVisitorId,
      sessionId: testSessionId,
      path: `/product/${testProduct.slug || "perfume"}`,
      title: testProduct.name,
      stage: "product_view",
      action: "pageview",
      metadata: { productId: testProduct._id.toString() },
    });
    assert.strictEqual(visit2.stage, "product_view", "Visit stage should be product_view");

    const visit3 = await Visit.create({
      visitorId: testVisitorId,
      sessionId: testSessionId,
      path: "/cart",
      title: "Cart",
      stage: "cart_view",
      action: "add_to_cart",
      metadata: { productId: testProduct._id.toString(), quantity: 2 },
    });
    assert.strictEqual(visit3.stage, "cart_view", "Visit stage should be cart_view");

    const visit4 = await Visit.create({
      visitorId: testVisitorId,
      sessionId: testSessionId,
      path: "/checkout",
      title: "Checkout",
      stage: "checkout_start",
      action: "checkout_start",
    });
    assert.strictEqual(visit4.stage, "checkout_start", "Visit stage should be checkout_start");
    console.log("✓ All 4 funnel visit events successfully created");

    // 5. Test Guest to Registered User Cart Merge
    console.log("\n--- 5. Testing Guest Cart Merge on User Registration/Login ---");
    const testUser = await User.create({
      full_name: `Test Customer ${testSuffix}`,
      email: `test_user_${testSuffix}@scnt.eg`,
      password: "hashedpassword123",
      role: "user",
    });

    const mergedCart = await cartRepository.mergeGuestCartIntoUserCart(testVisitorId, testUser._id);
    assert.ok(mergedCart, "Merge cart function should return merged user cart");
    assert.strictEqual(mergedCart.items.length, 1, "Merged cart should have 1 item");
    assert.strictEqual(mergedCart.items[0].quantity, 2, "Merged item quantity should be 2");

    // Verify guest cart is cleared/removed
    const oldGuestCart = await Cart.findOne({ visitorId: testVisitorId, user: null });
    assert.strictEqual(oldGuestCart, null, "Guest cart should be deleted after merge");
    console.log("✓ Guest cart seamlessly merged into registered user cart and cleared");

    // 6. Test Order Placement & Conversion Logging
    console.log("\n--- 6. Testing Order Conversion & Promo Usage ---");
    let testPromo = await PromoCode.findOne({ isActive: true });
    if (!testPromo) {
      testPromo = await PromoCode.create({
        code: `PROMO_${testSuffix.toUpperCase()}`,
        discountType: "PERCENTAGE",
        discountValue: 15,
        isActive: true,
      });
      console.log(`✓ Created test promo code: ${testPromo.code}`);
    } else {
      console.log(`✓ Using test promo code: ${testPromo.code}`);
    }

    const testOrder = await Order.create({
      user: testUser._id,
      items: [
        {
          product: testProduct._id,
          quantity: 2,
          price: 950,
        },
      ],
      subtotal: 1900,
      shipping: 80,
      discount: 285,
      promoCode: testPromo.code,
      total: 1695,
      status: "CONFIRMED",
      address: {
        fullName: testUser.full_name,
        phone: "01001234567",
        city: "Cairo",
        addressLine1: "123 El Horreya St",
        postalCode: "11511",
      },
    });

    const orderVisit = await Visit.create({
      visitorId: testVisitorId,
      sessionId: testSessionId,
      path: `/order-confirmation/${testOrder._id}`,
      title: "Order Placed",
      userId: testUser._id,
      stage: "order_placed",
      action: "order_placed",
      metadata: {
        orderId: testOrder._id.toString(),
        total: testOrder.total,
        promoCode: testOrder.promoCode,
      },
    });
    assert.strictEqual(orderVisit.stage, "order_placed", "Order visit stage should be order_placed");
    console.log(`✓ Order placed (#${testOrder._id}) with promo: ${testOrder.promoCode}`);

    // 7. Verify Timeline retrieval for this session
    console.log("\n--- 7. Testing Session Journey Timeline Retrieval ---");
    const sessionVisits = await Visit.find({ sessionId: testSessionId }).sort({ createdAt: 1 });
    assert.strictEqual(sessionVisits.length, 5, "Session should have 5 chronological timeline events");
    assert.strictEqual(sessionVisits[0].stage, "browse", "First step was browse");
    assert.strictEqual(sessionVisits[sessionVisits.length - 1].stage, "order_placed", "Last step was order_placed");
    console.log(`✓ Timeline successfully retrieved 5 events for session ${testSessionId}`);

    // Cleanup test artifacts
    await Cart.deleteOne({ user: testUser._id });
    await Order.deleteOne({ _id: testOrder._id });
    await User.deleteOne({ _id: testUser._id });
    await Visit.deleteMany({ sessionId: testSessionId });
    if (testProduct.name.includes("Test Fragrance")) {
      await Product.deleteOne({ _id: testProduct._id });
    }
    if (testPromo.code.includes("PROMO_")) {
      await PromoCode.deleteOne({ _id: testPromo._id });
    }
    console.log("✓ Test artifacts cleaned up");

    console.log("\n=======================================================");
    console.log("🎉 ALL FUNNEL, CART & COUPON TRACKING TESTS PASSED! 🎉");
    console.log("=======================================================\n");
  } catch (error) {
    console.error("Test failed with error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
