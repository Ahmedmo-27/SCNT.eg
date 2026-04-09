const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const authService = require("../services/authService");

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(successResponse(result, "User registered successfully"));
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.status(200).json(successResponse(result, "Login successful"));
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.userId);
  res.status(200).json(successResponse(user, "Profile retrieved"));
});

const updateMe = asyncHandler(async (req, res) => {
  const user = await authService.updateMe(req.user.userId, req.body);
  res.status(200).json(successResponse(user, "Profile updated"));
});

module.exports = {
  register,
  login,
  me,
  updateMe,
};
