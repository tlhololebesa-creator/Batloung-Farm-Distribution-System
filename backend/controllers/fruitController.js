
const fruitModel = require("../models/fruitModel");

async function getAllFruits(req, res) {
    try {
        const fruits = await fruitModel.getAllFruits();

        res.status(200).json({
            success: true,
            data: fruits
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve fruits."
        });
    }
}

async function addFruit(req, res) {
    try {
        const { name, description, status } = req.body;

        if (!name || typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Fruit name is required."
            });
        }

        if (status !== undefined && !["Active", "Inactive"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid fruit status."
            });
        }

        const fruitId = await fruitModel.addFruit({
            name: name.trim(),
            description,
            status: status || "Active"
        });

        res.status(201).json({
            success: true,
            message: "Fruit added successfully.",
            fruitId
        });
    } catch (error) {
        console.error(error.message);

        res.status(error.code === "ER_DUP_ENTRY" ? 400 : 500).json({
            success: false,
            message: error.code === "ER_DUP_ENTRY"
                ? "This fruit already exists."
                : "Failed to add fruit."
        });
    }
}

async function updateFruit(req, res) {
    try {
        const fruitID = Number(req.params.id);
        const { name, description, status } = req.body;

        if (!Number.isInteger(fruitID) || fruitID <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid fruit ID."
            });
        }

        if (!name || typeof name !== "string" || !name.trim() ||
            !["Active", "Inactive"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Valid fruit name and status are required."
            });
        }

        const affectedRows = await fruitModel.updateFruit(fruitID, {
            name: name.trim(),
            description,
            status
        });

        if (!affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Fruit not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Fruit updated successfully."
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            success: false,
            message: "Failed to update fruit."
        });
    }
}

async function deleteFruit(req, res) {
    try {
        const fruitID = Number(req.params.id);

        if (!Number.isInteger(fruitID) || fruitID <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid fruit ID."
            });
        }

        const affectedRows = await fruitModel.deleteFruit(fruitID);

        if (!affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Fruit not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Fruit deleted successfully."
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            success: false,
            message: "Failed to delete fruit. It may be linked to existing transactions."
        });
    }
}

module.exports = {
    getAllFruits,
    addFruit,
    updateFruit,
    deleteFruit
};
