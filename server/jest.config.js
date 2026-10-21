/**
 * Jest configuration for SCNT.eg backend automated tests.
 */
module.exports = {
  testEnvironment: "node",
  testMatch: [
    "<rootDir>/tests/**/*.test.js",
  ],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testTimeout: 30000,
  verbose: true,
};
