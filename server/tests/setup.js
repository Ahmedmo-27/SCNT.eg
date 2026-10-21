/**
 * Global Jest test setup for SCNT.eg backend tests.
 * Configures test database isolation (scnt-eg-test), email stubs,
 * persistent connection reuse, and clean teardown of timers and sockets.
 */
process.env.NODE_ENV = "test";

const mongoose = require("mongoose");
const env = require("../src/config/env");
const emailService = require("../src/services/emailService");
const { initializeCache, flushCache } = require("../src/utils/cache");

// Set default test timeout to 60000ms to allow SSL/Atlas operations without premature test failure
if (typeof jest !== "undefined" && typeof jest.setTimeout === "function") {
  jest.setTimeout(60000);
}

// Database Isolation: Override MONGODB_URI to target scnt-eg-test database on Atlas
const baseUri = process.env.MONGODB_URI || env.mongoUri;
const testUri = baseUri.replace("/scnt-eg-db?", "/scnt-eg-test?");
process.env.MONGODB_URI = testUri;
env.mongoUri = testUri;

// Stub SMTP / Nodemailer background operations to avoid real network calls
emailService.sendEmail = async () => ({ sent: true });
emailService.sendVerificationEmail = async () => ({ sent: true });
emailService.sendOrderConfirmationEmail = async () => ({ sent: true });
if (typeof emailService.sendPromotionalEmail === "function") {
  emailService.sendPromotionalEmail = async () => ({ sent: true });
}

beforeAll(async () => {
  // Initialize in-memory cache
  await initializeCache();

  // Connect to isolated test database if not already connected (reuse active connection)
  if (mongoose.connection.readyState === 1) {
    // Already connected, reuse active connection
  } else if (mongoose.connection.readyState === 2) {
    // Connecting in progress, wait for completion
    await mongoose.connection.asPromise();
  } else {
    await mongoose.connect(testUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 30000,
    });
  }

  // Populate shared global mongoose cache so connectDb() reuses this test connection
  globalThis.__mongooseConn = { conn: mongoose, promise: Promise.resolve(mongoose) };
});

afterEach(async () => {
  // Clear any 3600s cache timers set during test execution
  await flushCache();
});

afterAll(async () => {
  // Flush cache timers to prevent open handle hanging
  await flushCache();

  // In the runner process, reuse Mongoose connection across suites to eliminate connection churn.
  // Do NOT disconnect Mongoose in afterAll after every suite.
});
