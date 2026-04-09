const bcrypt = require("bcrypt");
const userRepository = require("../repositories/userRepository");
const ApiError = require("../utils/ApiError");
const { signToken } = require("../utils/jwt");

const sanitizeUser = (user) => ({
  id: user._id,
  full_name: user.full_name,
  email: user.email,
  role: user.role,
  address: user.address,
  createdAt: user.createdAt,
});

const normalizeAddress = (addressInput, full_name) => {
  if (!addressInput || typeof addressInput !== "object") return undefined;
  const t = (v) => (typeof v === "string" ? v.trim() : "");
  const fullName = t(addressInput.fullName) || full_name;
  const phone = t(addressInput.phone);
  const city = t(addressInput.city);
  const addressLine1 = t(addressInput.addressLine1);
  const addressLine2 = t(addressInput.addressLine2);
  const postalCode = t(addressInput.postalCode);
  if (!city && !addressLine1 && !addressLine2 && !postalCode && !phone) return undefined;
  return {
    fullName,
    phone,
    city,
    addressLine1,
    addressLine2,
    postalCode,
  };
};

const register = async ({ full_name, email, password, address: addressInput }) => {
  if (!full_name || !email || !password) {
    throw new ApiError(400, "full_name, email and password are required");
  }

  const existingUser = await userRepository.findByEmail(email.toLowerCase());
  if (existingUser) {
    throw new ApiError(409, "Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const payload = {
    full_name,
    email: email.toLowerCase(),
    password: hashedPassword,
  };
  const address = normalizeAddress(addressInput, full_name);
  if (address) payload.address = address;

  const user = await userRepository.createUser(payload);

  const token = signToken({ userId: user._id, role: user.role });
  return { user: sanitizeUser(user), token };
};

const login = async ({ email, password }) => {
  if (!email || !password) {
    throw new ApiError(400, "email and password are required");
  }

  const user = await userRepository.findByEmail(email.toLowerCase());
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = signToken({ userId: user._id, role: user.role });
  return { user: sanitizeUser(user), token };
};

const getMe = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  return sanitizeUser(user);
};

const updateMe = async (userId, body) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const update = {};

  if (body.full_name !== undefined) {
    const t = typeof body.full_name === "string" ? body.full_name.trim() : "";
    if (!t) throw new ApiError(400, "full_name cannot be empty");
    update.full_name = t;
  }

  if (body.email !== undefined) {
    const next = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!next) throw new ApiError(400, "email cannot be empty");
    const currentEmail = user.email.toLowerCase();
    if (next !== currentEmail) {
      const taken = await userRepository.findByEmail(next);
      if (taken && taken._id.toString() !== userId.toString()) {
        throw new ApiError(409, "Email already in use");
      }
    }
    update.email = next;
  }

  if (body.address !== undefined) {
    if (body.address === null || typeof body.address !== "object") {
      throw new ApiError(400, "address must be an object");
    }
    const cur = user.address?.toObject?.() ?? user.address ?? {};
    const t = (v) => (typeof v === "string" ? v.trim() : "");
    const a = body.address;
    const resolvedName = update.full_name !== undefined ? update.full_name : user.full_name;
    update.address = {
      fullName: a.fullName !== undefined ? t(a.fullName) : (cur.fullName || resolvedName),
      phone: a.phone !== undefined ? t(a.phone) : (cur.phone || ""),
      city: a.city !== undefined ? t(a.city) : (cur.city || ""),
      addressLine1: a.addressLine1 !== undefined ? t(a.addressLine1) : (cur.addressLine1 || ""),
      addressLine2: a.addressLine2 !== undefined ? t(a.addressLine2) : (cur.addressLine2 || ""),
      postalCode: a.postalCode !== undefined ? t(a.postalCode) : (cur.postalCode || ""),
    };
  }

  if (Object.keys(update).length === 0) {
    return sanitizeUser(user);
  }

  const updated = await userRepository.updateById(userId, update);
  return sanitizeUser(updated);
};

module.exports = {
  register,
  login,
  getMe,
  updateMe,
};
