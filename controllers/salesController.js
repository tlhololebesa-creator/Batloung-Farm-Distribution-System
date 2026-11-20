
const salesModel = require("../models/salesModel");

const getErrorStatus = (error) => {
  if (error.code) {
    return 500;
  }

  if (error.message && error.message.toLowerCase().includes("not found")) {
    return 404;
  }

  return 400;
};

const getSales = async (req, res) => {
  try {
    const sales = await salesModel.getAllSales();

    res.status(200).json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error("Get sales error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load sales."
    });
  }
};

const getSaleById = async (req, res) => {
  try {
    const saleID = Number(req.params.id);

    if (!Number.isInteger(saleID) || saleID <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid sale ID."
      });
    }

    const sale = await salesModel.getSaleById(saleID);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found."
      });
    }

    const items = await salesModel.getSaleDetails(saleID);

    res.status(200).json({
      success: true,
      data: {
        ...sale,
        items
      }
    });
  } catch (error) {
    console.error("Get sale details error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load sale details."
    });
  }
};

const addSale = async (req, res) => {
  try {
    const saleID = await salesModel.createSale(req.body);

    res.status(201).json({
      success: true,
      message: "Sale created successfully.",
      saleID
    });
  } catch (error) {
    console.error("Create sale error:", error);

    res.status(getErrorStatus(error)).json({
      success: false,
      message: error.message || "Failed to create sale."
    });
  }
};

const editSale = async (req, res) => {
  try {
    const saleID = Number(req.params.id);

    if (!Number.isInteger(saleID) || saleID <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid sale ID."
      });
    }

    await salesModel.updateSale(saleID, req.body);

    res.status(200).json({
      success: true,
      message: "Sale updated successfully."
    });
  } catch (error) {
    console.error("Update sale error:", error);

    res.status(getErrorStatus(error)).json({
      success: false,
      message: error.message || "Failed to update sale."
    });
  }
};

const removeSale = async (req, res) => {
  try {
    const saleID = Number(req.params.id);

    if (!Number.isInteger(saleID) || saleID <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid sale ID."
      });
    }

    await salesModel.deleteSale(saleID);

    res.status(200).json({
      success: true,
      message: "Sale deleted successfully."
    });
  } catch (error) {
    console.error("Delete sale error:", error);

    res.status(getErrorStatus(error)).json({
      success: false,
      message: error.message || "Failed to delete sale."
    });
  }
};

module.exports = {
  getSales,
  getSaleById,
  addSale,
  editSale,
  removeSale
};
