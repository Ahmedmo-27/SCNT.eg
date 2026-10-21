const bcrypt = require("bcryptjs");
const User = require("../../src/models/User");
const { signToken } = require("../../src/utils/jwt");

const ADMIN_CREDENTIALS = {
  email: "admin.qa@scnt.eg",
  password: "AdminPassword123!",
  full_name: "QA Admin User",
};

const USER_CREDENTIALS = {
  email: "customer.qa@scnt.eg",
  password: "UserPassword123!",
  full_name: "QA Customer User",
};

/**
 * Ensures an admin user exists in the test database and returns auth credentials,
 * including a signed JWT and ready-to-use Authorization header.
 */
async function getAdminAuth(overrides = {}) {
  const email = (overrides.email || ADMIN_CREDENTIALS.email).toLowerCase().trim();
  const rawPassword = overrides.password || ADMIN_CREDENTIALS.password;

  let admin = await User.findOne({ email });
  if (!admin) {
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    admin = await User.create({
      full_name: overrides.full_name || ADMIN_CREDENTIALS.full_name,
      email,
      password: hashedPassword,
      role: "admin",
      isEmailVerified: true,
      ...overrides,
    });
  } else if (admin.role !== "admin") {
    admin.role = "admin";
    await admin.save();
  }

  const token = signToken({
    userId: admin._id.toString(),
    role: "admin",
  });

  return {
    token,
    user: admin,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: {
      email,
      password: rawPassword,
    },
  };
}

/**
 * Ensures a regular user exists in the test database and returns auth credentials,
 * including a signed JWT and ready-to-use Authorization header.
 */
async function getUserAuth(overrides = {}) {
  const email = (overrides.email || USER_CREDENTIALS.email).toLowerCase().trim();
  const rawPassword = overrides.password || USER_CREDENTIALS.password;

  let user = await User.findOne({ email });
  if (!user) {
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    user = await User.create({
      full_name: overrides.full_name || USER_CREDENTIALS.full_name,
      email,
      password: hashedPassword,
      role: "user",
      isEmailVerified: true,
      ...overrides,
    });
  }

  const token = signToken({
    userId: user._id.toString(),
    role: "user",
  });

  return {
    token,
    user,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: {
      email,
      password: rawPassword,
    },
  };
}

module.exports = {
  getAdminAuth,
  getUserAuth,
  ADMIN_CREDENTIALS,
  USER_CREDENTIALS,
};
