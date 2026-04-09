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

const verifyEmail = asyncHandler(async (req, res) => {
  const token = req.body?.token || req.query?.token;
  const user = await authService.verifyEmail({ token });
  res.status(200).json(successResponse(user, "Email verified successfully"));
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
  const result = await authService.resendVerificationEmail(req.user.userId);
  res.status(200).json(successResponse(result, "Verification email sent"));
});

module.exports = {
  register,
  login,
  me,
  updateMe,
  verifyEmail,
  resendVerificationEmail,
};
