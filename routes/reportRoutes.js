
const express = require("express");
const router = express.Router();

const {
    getTopSellingFruits,
    getSalesRevenue,
    getTopVendor,
    getCurrentStockReport
} = require("../controllers/reportController");

router.get("/top-fruits", getTopSellingFruits);
router.get("/revenue", getSalesRevenue);
router.get("/top-vendor", getTopVendor);
router.get("/current-stock", getCurrentStockReport);

module.exports = router;
