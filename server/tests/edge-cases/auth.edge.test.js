const testClient = require("../helpers/testClient");
const { getUserAuth } = require("../helpers/authHelper");
const User = require("../../src/models/User");

describe("Auth Defensive Boundary & Edge-Case Validation Harness", () => {
  let existingUserAuth;
  const existingEmail = `edge.auth.existing.${Date.now()}@scnt.eg`;

  beforeAll(async () => {
    existingUserAuth = await getUserAuth({
      email: existingEmail,
      password: "ExistingPassword123!",
      full_name: "Existing Edge User",
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /edge\.auth\./ } });
  });

  describe("Missing Registration Fields (400 Bad Request)", () => {
    it("rejects registration when full_name is missing", async () => {
      const res = await testClient.post("/api/auth/register", {
        email: `valid.email.${Date.now()}@scnt.eg`,
        password: "ValidPassword123!",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/full_name.*required/i);
    });

    it("rejects registration when email is missing", async () => {
      const res = await testClient.post("/api/auth/register", {
        full_name: "Missing Email User",
        password: "ValidPassword123!",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/email.*required/i);
    });

    it("rejects registration when password is missing", async () => {
      const res = await testClient.post("/api/auth/register", {
        full_name: "Missing Password User",
        email: `valid.email.${Date.now()}@scnt.eg`,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/password.*required/i);
    });
  });

  describe("Duplicate Email Registration (409 Conflict)", () => {
    it("rejects registration when email is already registered", async () => {
      const res = await testClient.post("/api/auth/register", {
        full_name: "Duplicate User",
        email: existingEmail,
        password: "AnotherPassword123!",
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/email already registered/i);
    });

    it("rejects registration with case-insensitive duplicate email", async () => {
      const res = await testClient.post("/api/auth/register", {
        full_name: "Duplicate Upper User",
        email: existingEmail.toUpperCase(),
        password: "AnotherPassword123!",
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/email already registered/i);
    });
  });

  describe("Invalid Login Credentials (401 Unauthorized)", () => {
    it("rejects login with wrong password", async () => {
      const res = await testClient.post("/api/auth/login", {
        email: existingEmail,
        password: "WrongPassword999!",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid credentials/i);
    });

    it("rejects login with non-existent email address", async () => {
      const res = await testClient.post("/api/auth/login", {
        email: `nonexistent.${Date.now()}@scnt.eg`,
        password: "SomePassword123!",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid credentials/i);
    });

    it("rejects login when email or password is empty string", async () => {
      const res = await testClient.post("/api/auth/login", {
        email: "",
        password: "",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/email and password are required/i);
    });
  });

  describe("Token Verification Boundaries (401 Unauthorized)", () => {
    it("rejects access to protected endpoint without Authorization header", async () => {
      const res = await testClient.get("/api/auth/me");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/token is required/i);
    });

    it("rejects access with malformed JWT token string", async () => {
      const res = await testClient.get("/api/auth/me", {
        Authorization: "Bearer malformed.jwt.token.here",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid or expired token/i);
    });

    it("rejects access with empty Bearer prefix", async () => {
      const res = await testClient.get("/api/auth/me", {
        Authorization: "Bearer ",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/token is required|invalid/i);
    });
  });

  describe("Email Verification Boundaries", () => {
    it("rejects verification with missing token", async () => {
      const res = await testClient.post("/api/auth/verify-email", {});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/token is required/i);
    });

    it("rejects verification with invalid or non-existent token", async () => {
      const res = await testClient.post("/api/auth/verify-email", {
        token: "completely-invalid-nonexistent-token",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid or expired/i);
    });
  });

  describe("Profile Update Edge Cases", () => {
    it("rejects profile update with empty full_name", async () => {
      const res = await testClient.patch(
        "/api/auth/me",
        { full_name: "   " },
        existingUserAuth.headers
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/full_name cannot be empty/i);
    });

    it("rejects profile update when address is not an object", async () => {
      const res = await testClient.patch(
        "/api/auth/me",
        { address: "invalid-string-address" },
        existingUserAuth.headers
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/address must be an object/i);
    });
  });
});
