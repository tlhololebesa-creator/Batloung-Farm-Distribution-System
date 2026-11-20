
const {
    getAllPurchases,
    getPurchaseDetails,
    createPurchase
} = require("../models/purchaseModel");

const getPurchases = async (req, res) => {
    try {
        const purchases = await getAllPurchases();

        res.status(200).json({
            success: true,
            data: purchases
        });
    } catch (error) {
        console.error("Error loading purchases:", error);

        res.status(500).json({
            success: false,
            message: "Could not load purchases."
        });
    }
};

const getPurchaseById = async (req, res) => {
    try {
        const purchaseID = Number(req.params.id);

        if (!Number.isInteger(purchaseID) || purchaseID <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid purchase ID."
            });
        }

        const details = await getPurchaseDetails(purchaseID);

        if (!details || details.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Purchase not found."
            });
        }

        res.status(200).json({
            success: true,
            data: details
        });
    } catch (error) {
        console.error("Error loading purchase details:", error);

        res.status(500).json({
            success: false,
            message: "Could not load purchase details."
        });
    }
};

const addPurchase = async (req, res) => {
    try {
        const result = await createPurchase(req.body);

        res.status(201).json({
            success: true,
            message: "Purchase saved successfully.",
            data: result
        });
    } catch (error) {
        console.error("Error saving purchase:", error);

        let statusCode = 400;

        if (error.code) {
            statusCode = 500;
        } else if (
            error.message &&
            (
                error.message.includes("does not exist") ||
                error.message.includes("not found")
            )
        ) {
            statusCode = 404;
        }

        res.status(statusCode).json({
            success: false,
            message: error.message || "Could not save purchase."
        });
    }
};

module.exports = {
    getPurchases,
    getPurchaseById,
    addPurchase
};
