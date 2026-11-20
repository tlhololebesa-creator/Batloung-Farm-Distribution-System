
const supplierModel = require("../models/supplierModel");

async function getAllSuppliers(req, res) {
    try {
        const suppliers = await supplierModel.getAllSuppliers();

        res.status(200).json({
            success: true,
            data: suppliers
        });
    } catch (error) {
        console.error("Error fetching suppliers:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch suppliers"
        });
    }
}

async function addSupplier(req, res) {
    try {
        const { name, contactPerson, phone, address, province } = req.body;

        if (!name || !contactPerson || !phone || !address || !province) {
            return res.status(400).json({
                success: false,
                message: "Please fill in all supplier fields"
            });
        }

        const supplierID = await supplierModel.addSupplier(req.body);

        res.status(201).json({
            success: true,
            message: "Supplier added successfully",
            supplierID
        });
    } catch (error) {
        console.error("Error adding supplier:", error);

        res.status(error.code ? 500 : 400).json({
            success: false,
            message: error.message || "Failed to add supplier"
        });
    }
}

async function updateSupplier(req, res) {
    try {
        const supplierID = Number(req.params.id);

        if (!Number.isInteger(supplierID) || supplierID <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid supplier ID"
            });
        }

        const { name, contactPerson, phone, address, province } = req.body;

        if (!name || !contactPerson || !phone || !address || !province) {
            return res.status(400).json({
                success: false,
                message: "Please fill in all supplier fields"
            });
        }

        const result = await supplierModel.updateSupplier(supplierID, req.body);

        if (result === 0) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Supplier updated successfully"
        });
    } catch (error) {
        console.error("Error updating supplier:", error);

        res.status(error.code ? 500 : 400).json({
            success: false,
            message: error.message || "Failed to update supplier"
        });
    }
}

async function deleteSupplier(req, res) {
    try {
        const supplierID = Number(req.params.id);

        if (!Number.isInteger(supplierID) || supplierID <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid supplier ID"
            });
        }

        const result = await supplierModel.deleteSupplier(supplierID);

        if (result === 0) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Supplier deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting supplier:", error);

        res.status(error.code ? 500 : 400).json({
            success: false,
            message: error.message || "Failed to delete supplier"
        });
    }
}

module.exports = {
    getAllSuppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier
};
