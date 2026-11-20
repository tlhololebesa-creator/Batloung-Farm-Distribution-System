const express = require("express");
const router = express.Router();

const {
    getStock,
    createStock,
    editStock,
    removeStock
} = require("../controllers/stockController");

router.get("/", getStock);
router.post("/", createStock);
router.put("/:id", editStock);
router.delete("/:id", removeStock);

module.exports = router;