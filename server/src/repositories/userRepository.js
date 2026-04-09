const User = require("../models/User");

const createUser = (payload) => User.create(payload);
const findByEmail = (email) => User.findOne({ email });
const findById = (id) => User.findById(id);
const findByVerificationToken = (tokenHash) =>
  User.findOne({
    emailVerificationToken: tokenHash,
    emailVerificationExpiresAt: { $gt: new Date() },
  });
const findUsersForPromotion = ({ onlyVerified = false } = {}) => {
  const query = onlyVerified ? { isEmailVerified: true } : {};
  return User.find(query).select("email full_name isEmailVerified");
};
const updateById = (id, payload) =>
  User.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true });

module.exports = {
  createUser,
  findByEmail,
  findById,
  findByVerificationToken,
  findUsersForPromotion,
  updateById,
};
