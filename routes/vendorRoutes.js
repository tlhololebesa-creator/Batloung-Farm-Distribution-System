const express = require("express");
const router = express.Router();

const vendorController = require("../controllers/vendorController");

router.get("/", vendorController.getVendors);
router.get("/search", vendorController.searchVendors);
router.post("/", vendorController.createVendor);
router.put("/:id", vendorController.editVendor);
router.delete("/:id", vendorController.removeVendor);

module.exports = router;