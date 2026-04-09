const User = require("../models/User");

const createUser = (payload) => User.create(payload);
const findByEmail = (email) => User.findOne({ email });
const findById = (id) => User.findById(id);
const updateById = (id, payload) =>
  User.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true });

module.exports = {
  createUser,
  findByEmail,
  findById,
  updateById,
};
