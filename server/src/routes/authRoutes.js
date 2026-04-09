const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-verification-email", authMiddleware, authController.resendVerificationEmail);
router.get("/me", authMiddleware, authController.me);
router.patch("/me", authMiddleware, authController.updateMe);

module.exports = router;
