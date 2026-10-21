const crypto = require("node:crypto");
const testClient = require("../helpers/testClient");
const { getUserAuth } = require("../helpers/authHelper");
const User = require("../../src/models/User");

describe("Auth Domain Test Suite", () => {
  const timestamp = Date.now();
  const testUserEmail = `auth.test.${timestamp}@scnt.eg`;
  const testPassword = "ValidPassword123!";
  let authToken;
  let registeredUserId;

  afterAll(async () => {
    // Cleanup users created during this test
    await User.deleteMany({ email: { $regex: /auth\.test\./ } });
  });

  describe("User Registration (POST /api/auth/register)", () => {
    it("successfully registers a new user account with complete details", async () => {
      const payload = {
        full_name: "Test Auth User",
        email: testUserEmail,
        password: testPassword,
        address: {
          fullName: "Test Auth User",
          phone: "01012345678",
          city: "Cairo",
          addressLine1: "123 Nile Street",
          addressLine2: "Apt 4B",
          postalCode: "11511",
        },
      };

      const res = await testClient.post("/api/auth/register", payload);

      expect(res.status).toBe(201);
      expect(res.body).toBeDefined();
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("User registered successfully");
      expect(res.body.data).toBeDefined();
      expect(res.body.data.token).toBeDefined();
      expect(typeof res.body.data.token).toBe("string");

      const user = res.body.data.user;
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(testUserEmail.toLowerCase());
      expect(user.full_name).toBe("Test Auth User");
      expect(user.role).toBe("user");
      expect(user.isEmailVerified).toBe(false);
      expect(user.password).toBeUndefined(); // Security: password omitted
      expect(user.address).toBeDefined();
      expect(user.address.city).toBe("Cairo");

      authToken = res.body.data.token;
      registeredUserId = user.id;
    });
  });

  describe("User Login (POST /api/auth/login)", () => {
    it("successfully authenticates registered user and issues JWT token", async () => {
      const res = await testClient.post("/api/auth/login", {
        email: testUserEmail,
        password: testPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Login successful");
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testUserEmail.toLowerCase());
      expect(res.body.data.user.full_name).toBe("Test Auth User");
      expect(res.body.data.user.password).toBeUndefined();

      // Store fresh token
      authToken = res.body.data.token;
    });
  });

  describe("Profile Retrieval (GET /api/auth/me)", () => {
    it("retrieves current authenticated user profile", async () => {
      const res = await testClient.get("/api/auth/me", {
        Authorization: `Bearer ${authToken}`,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Profile retrieved");
      expect(res.body.data.id).toBe(registeredUserId);
      expect(res.body.data.email).toBe(testUserEmail.toLowerCase());
      expect(res.body.data.full_name).toBe("Test Auth User");
      expect(res.body.data.password).toBeUndefined();
    });
  });

  describe("Profile Update (PATCH /api/auth/me)", () => {
    it("updates full name and shipping address details", async () => {
      const updatePayload = {
        full_name: "Updated Auth User",
        address: {
          fullName: "Updated Auth User",
          phone: "01099998888",
          city: "Giza",
          addressLine1: "456 Pyramids Road",
          postalCode: "12345",
        },
      };

      const res = await testClient.patch("/api/auth/me", updatePayload, {
        Authorization: `Bearer ${authToken}`,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Profile updated");
      expect(res.body.data.full_name).toBe("Updated Auth User");
      expect(res.body.data.address.city).toBe("Giza");
      expect(res.body.data.address.phone).toBe("01099998888");

      // Verify persistence via GET /api/auth/me
      const verifyRes = await testClient.get("/api/auth/me", {
        Authorization: `Bearer ${authToken}`,
      });
      expect(verifyRes.body.data.full_name).toBe("Updated Auth User");
      expect(verifyRes.body.data.address.city).toBe("Giza");
    });
  });

  describe("Email Verification (POST /api/auth/verify-email)", () => {
    it("verifies user email address using SHA-256 verification token", async () => {
      // Generate a raw verification token and hash it into the user document
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      await User.findByIdAndUpdate(registeredUserId, {
        isEmailVerified: false,
        emailVerificationToken: tokenHash,
        emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const res = await testClient.post("/api/auth/verify-email", { token: rawToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Email verified successfully");
      expect(res.body.data.isEmailVerified).toBe(true);

      // Verify database state directly
      const updatedUser = await User.findById(registeredUserId);
      expect(updatedUser.isEmailVerified).toBe(true);
      expect(updatedUser.emailVerificationToken).toBeNull();
    });

    it("allows requesting a new verification email via POST /api/auth/resend-verification-email", async () => {
      // Set email to unverified first
      await User.findByIdAndUpdate(registeredUserId, { isEmailVerified: false });

      const res = await testClient.post(
        "/api/auth/resend-verification-email",
        {},
        { Authorization: `Bearer ${authToken}` }
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Verification email sent");
      expect(res.body.data.sent).toBe(true);
    });
  });
});
