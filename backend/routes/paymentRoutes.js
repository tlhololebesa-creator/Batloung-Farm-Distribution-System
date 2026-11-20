
const express = require("express");
const router = express.Router();

const {
  getPayments,
  getPaymentsBySale,
  addPayment,
  editPayment,
  removePayment
} = require("../controllers/paymentController");

router.get("/", getPayments);
router.get("/sale/:saleID", getPaymentsBySale);
router.post("/", addPayment);
router.put("/:id", editPayment);
router.delete("/:id", removePayment);

module.exports = router;
