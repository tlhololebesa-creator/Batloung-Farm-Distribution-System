
const express = require("express");
const router = express.Router();

const {
  getSales,
  getSaleById,
  addSale,
  editSale,
  removeSale
} = require("../controllers/salesController");

router.get("/", getSales);
router.get("/:id", getSaleById);
router.post("/", addSale);
router.put("/:id", editSale);
router.delete("/:id", removeSale);

module.exports = router;
