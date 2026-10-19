const path = require("path");
const fs = require("fs");
const assert = require("assert");

// Test User-Agent Parser
const {
  parseUserAgent,
  normalizeReferrerDomain,
} = require("../src/utils/userAgentParser");

console.log("=== 1. Testing User-Agent & Referrer Parser ===");

const mobileUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1";
const parsedMobile = parseUserAgent(mobileUA);
assert.strictEqual(parsedMobile.device, "mobile", "Expected iPhone to be detected as mobile");
assert.strictEqual(parsedMobile.browser, "Safari", "Expected browser to be Safari");
assert.strictEqual(parsedMobile.os, "iOS", "Expected OS to be iOS");
assert.strictEqual(parsedMobile.isBot, false, "Expected iPhone not to be a bot");
console.log("✓ Mobile user agent parsed correctly:", parsedMobile);

const desktopUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const parsedDesktop = parseUserAgent(desktopUA);
assert.strictEqual(parsedDesktop.device, "desktop", "Expected desktop device");
assert.strictEqual(parsedDesktop.browser, "Chrome", "Expected Chrome browser");
assert.strictEqual(parsedDesktop.os, "Windows", "Expected Windows OS");
assert.strictEqual(parsedDesktop.isBot, false, "Expected desktop not to be a bot");
console.log("✓ Desktop user agent parsed correctly:", parsedDesktop);

const botUA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const parsedBot = parseUserAgent(botUA);
assert.strictEqual(parsedBot.isBot, true, "Expected Googlebot to be detected as bot");
console.log("✓ Bot user agent parsed correctly:", parsedBot);

const googleRef = normalizeReferrerDomain("https://www.google.com/search?q=scnt+egypt");
assert.strictEqual(googleRef, "google.com", "Expected google.com referrer");

const instaAppRef = normalizeReferrerDomain("android-app://com.instagram.android");
assert.strictEqual(instaAppRef, "instagram.com", "Expected instagram.com referrer");

const directRef = normalizeReferrerDomain("");
assert.strictEqual(directRef, "direct", "Expected empty referrer to be direct");
console.log("✓ Referrer normalization passed");

// Test Logger
console.log("\n=== 2. Testing Logger System ===");
const logger = require("../src/utils/logger");

logger.info("Test info message", { context: "unit-test", sampleId: 101 });
logger.warn("Test warn message", { context: "unit-test", sampleId: 102 });
logger.error("Test error message", { context: "unit-test", stack: "Error: test stack\n    at test" });
logger.audit("Test audit message", { context: "audit", action: "UNIT_TEST", targetType: "Test" });

const logsDir = path.resolve(__dirname, "../logs");
const combinedLog = path.join(logsDir, "combined.log");
const errorLog = path.join(logsDir, "error.log");

assert.ok(fs.existsSync(combinedLog), "combined.log should exist");
assert.ok(fs.existsSync(errorLog), "error.log should exist");

const combinedContent = fs.readFileSync(combinedLog, "utf8");
const errorContent = fs.readFileSync(errorLog, "utf8");

assert.ok(combinedContent.includes("Test info message"), "combined.log should contain info log");
assert.ok(errorContent.includes("Test error message"), "error.log should contain error log");
assert.ok(!errorContent.includes("Test info message"), "error.log should NOT contain info log");
console.log("✓ File logging verified in logs/combined.log and logs/error.log");

// Test Models
console.log("\n=== 3. Testing Mongoose Model Declarations ===");
const Log = require("../src/models/Log");
const Visit = require("../src/models/Visit");

assert.ok(Log.schema.paths.level, "Log model should have level field");
assert.ok(Log.schema.paths.context, "Log model should have context field");
assert.ok(Log.schema.paths.message, "Log model should have message field");
assert.ok(Visit.schema.paths.visitorId, "Visit model should have visitorId field");
assert.ok(Visit.schema.paths.sessionId, "Visit model should have sessionId field");
assert.ok(Visit.schema.paths.path, "Visit model should have path field");
assert.ok(Visit.schema.paths.device, "Visit model should have device field");
console.log("✓ Models validated successfully");

console.log("\nALL LOGGER AND ANALYTICS INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉\n");
