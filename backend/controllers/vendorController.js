
const vendorModel = require("../models/vendorModel");

const getVendors = async (req, res) => {
    try {
        const results = await vendorModel.getAllVendors();

        res.status(200).json({
            success: true,
            data: results
        });
    } catch (err) {
        console.error("Error retrieving vendors:", err);

        res.status(500).json({
            success: false,
            message: "Error retrieving vendors"
        });
    }
};

const searchVendors = async (req, res) => {
    try {
        const searchTerm = req.query.search;

        if (typeof searchTerm !== "string" || !searchTerm.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please provide a vendor name or phone number to search."
            });
        }

        const results = await vendorModel.searchVendors(searchTerm.trim());

        res.status(200).json({
            success: true,
            data: results
        });
    } catch (err) {
        console.error("Error searching vendors:", err);

        res.status(500).json({
            success: false,
            message: "Error searching vendors"
        });
    }
};

const createVendor = async (req, res) => {
    try {
        const { name, phone, location, registrationDate } = req.body;

        if (
            typeof name !== "string" || !name.trim() ||
            typeof phone !== "string" || !phone.trim() ||
            typeof location !== "string" || !location.trim() ||
            !registrationDate
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid vendor details."
            });
        }

        const vendor = {
            name: name.trim(),
            phone: phone.trim(),
            location: location.trim(),
            registrationDate
        };

        const result = await vendorModel.addVendor(vendor);

        res.status(201).json({
            success: true,
            message: "Vendor added successfully",
            id: result.insertId
        });
    } catch (err) {
        console.error("Error adding vendor:", err);

        res.status(err.code === "ER_DUP_ENTRY" ? 400 : 500).json({
            success: false,
            message: err.code === "ER_DUP_ENTRY"
                ? "This phone number is already registered."
                : "Error adding vendor"
        });
    }
};

const editVendor = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name, phone, location, registrationDate } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid vendor ID."
            });
        }

        if (
            typeof name !== "string" || !name.trim() ||
            typeof phone !== "string" || !phone.trim() ||
            typeof location !== "string" || !location.trim() ||
            !registrationDate
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid vendor details."
            });
        }

        const vendor = {
            name: name.trim(),
            phone: phone.trim(),
            location: location.trim(),
            registrationDate
        };

        const result = await vendorModel.updateVendor(id, vendor);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Vendor updated successfully"
        });
    } catch (err) {
        console.error("Error updating vendor:", err);

        res.status(err.code === "ER_DUP_ENTRY" ? 400 : 500).json({
            success: false,
            message: err.code === "ER_DUP_ENTRY"
                ? "This phone number is already registered."
                : "Error updating vendor"
        });
    }
};

const removeVendor = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid vendor ID."
            });
        }

        const result = await vendorModel.deleteVendor(id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Vendor deleted successfully"
        });
    } catch (err) {
        console.error("Error deleting vendor:", err);

        res.status(500).json({
            success: false,
            message: "Error deleting vendor"
        });
    }
};

module.exports = {
    getVendors,
    searchVendors,
    createVendor,
    editVendor,
    removeVendor
};