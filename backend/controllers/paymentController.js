
const paymentModel = require("../models/paymentModel");

const getPayments = async (req, res) => {
  try {
    const payments = await paymentModel.getAllPayments();

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error("Error loading payments:", error);

    res.status(500).json({
      success: false,
      message: "Could not load payments."
    });
  }
};

const getPaymentsBySale = async (req, res) => {
  try {
    const saleID = Number(req.params.saleID);

    if (!Number.isInteger(saleID) || saleID <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid sale ID."
      });
    }

    const payments = await paymentModel.getPaymentsBySale(saleID);

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error("Error loading sale payments:", error);

    res.status(500).json({
      success: false,
      message: "Could not load sale payments."
    });
  }
};

const addPayment = async (req, res) => {
  try {
    const paymentID = await paymentModel.createPayment(req.body);

    res.status(201).json({
      success: true,
      message: "Payment saved successfully.",
      data: { id: paymentID }
    });
  } catch (error) {
    console.error("Error saving payment:", error);

    const statusCode = error.code ? 500 : 400;

    res.status(statusCode).json({
      success: false,
      message: error.message || "Could not save payment."
    });
  }
};

const editPayment = async (req, res) => {
  try {
    const paymentID = Number(req.params.id);

    if (!Number.isInteger(paymentID) || paymentID <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID."
      });
    }

    await paymentModel.updatePayment(paymentID, req.body);

    res.status(200).json({
      success: true,
      message: "Payment updated successfully.",
      data: { id: paymentID }
    });
  } catch (error) {
    console.error("Error updating payment:", error);

    let statusCode = error.code ? 500 : 400;

    if (error.message === "Payment not found.") {
      statusCode = 404;
    }

    res.status(statusCode).json({
      success: false,
      message: error.message || "Could not update payment."
    });
  }
};

const removePayment = async (req, res) => {
  try {
    const paymentID = Number(req.params.id);

    if (!Number.isInteger(paymentID) || paymentID <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID."
      });
    }

    await paymentModel.deletePayment(paymentID);

    res.status(200).json({
      success: true,
      message: "Payment deleted successfully."
    });
  } catch (error) {
    console.error("Error deleting payment:", error);

    let statusCode = error.code ? 500 : 400;

    if (error.message === "Payment not found.") {
      statusCode = 404;
    }

    res.status(statusCode).json({
      success: false,
      message: error.message || "Could not delete payment."
    });
  }
};

module.exports = {
  getPayments,
  getPaymentsBySale,
  addPayment,
  editPayment,
  removePayment
};
