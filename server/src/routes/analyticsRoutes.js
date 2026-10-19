const express = require("express");
const analyticsController = require("../controllers/analyticsController");
const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware");

const router = express.Router();

router.post("/visit", optionalAuthMiddleware, analyticsController.trackVisit);

module.exports = router;
