
const stockModel = require("../models/stockModel");

const validSizes = ["Small", "Medium", "Large"];

const getStock = async (req, res) => {
    try {
        const stock = await stockModel.getAllStock();

        res.status(200).json({
            success: true,
            data: stock
        });
    } catch (error) {
        console.error("Error loading stock:", error);

        res.status(500).json({
            success: false,
            message: "Could not load stock."
        });
    }
};

const createStock = async (req, res) => {
    try {
        const { fruit, size, quantity } = req.body;

        if (
            typeof fruit !== "string" ||
            !fruit.trim() ||
            !validSizes.includes(size) ||
            quantity === undefined ||
            quantity === null ||
            String(quantity).trim() === "" ||
            !Number.isInteger(Number(quantity)) ||
            Number(quantity) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid stock information."
            });
        }

        const result = await stockModel.addStock({
            fruit: fruit.trim(),
            size,
            quantity: Number(quantity)
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Fruit was not found. Please add it first."
            });
        }

        res.status(201).json({
            success: true,
            message: "Stock saved successfully."
        });
    } catch (error) {
        console.error("Error saving stock:", error);

        res.status(500).json({
            success: false,
            message: "Could not save stock."
        });
    }
};

const editStock = async (req, res) => {
    try {
        const stockID = Number(req.params.id);

        if (!Number.isInteger(stockID) || stockID <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid stock ID."
            });
        }

        const { fruit, size, quantity } = req.body;

        if (
            typeof fruit !== "string" ||
            !fruit.trim() ||
            !validSizes.includes(size) ||
            quantity === undefined ||
            quantity === null ||
            String(quantity).trim() === "" ||
            !Number.isInteger(Number(quantity)) ||
            Number(quantity) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid stock information."
            });
        }

        const result = await stockModel.updateStock(stockID, {
            fruit: fruit.trim(),
            size,
            quantity: Number(quantity)
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Stock record was not found or no changes were made."
            });
        }

        res.status(200).json({
            success: true,
            message: "Stock updated successfully."
        });
    } catch (error) {
        console.error("Error updating stock:", error);

        res.status(500).json({
            success: false,
            message: "Could not update stock."
        });
    }
};

const removeStock = async (req, res) => {
    try {
        const stockID = Number(req.params.id);

        if (!Number.isInteger(stockID) || stockID <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid stock ID."
            });
        }

        const result = await stockModel.deleteStock(stockID);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Stock record was not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Stock deleted successfully."
        });
    } catch (error) {
        console.error("Error deleting stock:", error);

        res.status(500).json({
            success: false,
            message: "Could not delete stock."
        });
    }
};

module.exports = {
    getStock,
    createStock,
    editStock,
    removeStock
};
