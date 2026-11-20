
const reportModel = require("../models/reportModel");

const isValidDate = (date) => {
    if (
        typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
        return false;
    }

    const parsedDate = new Date(`${date}T00:00:00`);

    return (
        !Number.isNaN(parsedDate.getTime()) &&
        parsedDate.toISOString().slice(0, 10) === date
    );
};

// Get top 5 selling fruits
const getTopSellingFruits = async (req, res) => {
    try {
        const results = await reportModel.getTopSellingFruits();

        res.status(200).json({
            success: true,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve top selling fruits.",
            error: error.message
        });
    }
};

// Get sales revenue within a date range
const getSalesRevenue = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "Start date and end date are required."
            });
        }

        if (
            !isValidDate(startDate) ||
            !isValidDate(endDate) ||
            startDate > endDate
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid dates and ensure the start date is not after the end date."
            });
        }

        const results = await reportModel.getSalesRevenue(startDate, endDate);

        res.status(200).json({
            success: true,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve sales revenue.",
            error: error.message
        });
    }
};

// Get vendor with the highest number of boxes sold
const getTopVendor = async (req, res) => {
    try {
        const results = await reportModel.getTopVendor();

        res.status(200).json({
            success: true,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve top vendor.",
            error: error.message
        });
    }
};

// Get current stock by fruit and packaging size
const getCurrentStockReport = async (req, res) => {
    try {
        const results = await reportModel.getCurrentStockReport();

        res.status(200).json({
            success: true,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve current stock report.",
            error: error.message
        });
    }
};

module.exports = {
    getTopSellingFruits,
    getSalesRevenue,
    getTopVendor,
    getCurrentStockReport
};
