const express = require("express");
const router = express.Router();

const {
    getPurchases,
    getPurchaseById,
    addPurchase
} = require("../controllers/purchaseController");

router.get("/", getPurchases);
router.get("/:id", getPurchaseById);
router.post("/", addPurchase);

module.exports = router;