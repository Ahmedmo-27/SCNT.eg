const express = require("express");
const promotionController = require("../controllers/promotionController");

const router = express.Router();

router.get("/active", promotionController.getActivePromotion);
router.post("/claim", promotionController.claimPromotion);

module.exports = router;
