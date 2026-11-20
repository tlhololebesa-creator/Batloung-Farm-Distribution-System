
const express = require("express");
const router = express.Router();

const fruitController = require("../controllers/fruitController");

// Retrieve all fruits
router.get("/", fruitController.getAllFruits);

// Add a fruit
router.post("/", fruitController.addFruit);

// Update a fruit
router.put("/:id", fruitController.updateFruit);

// Delete a fruit
router.delete("/:id", fruitController.deleteFruit);

module.exports = router;
