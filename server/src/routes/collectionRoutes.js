const express = require("express");
const collectionController = require("../controllers/collectionController");

const router = express.Router();

router.get("/", collectionController.getCollections);
router.get("/:slug", collectionController.getCollectionBySlug);

module.exports = router;
