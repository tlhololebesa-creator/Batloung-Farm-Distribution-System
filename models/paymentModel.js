
const { db } = require("../config/db");

const validPaymentMethods = [
  "Cash",
  "Mobile Money",
  "Outstanding/Credit"
];

const isValidDate = (date) => {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsedDate = new Date(`${date}T00:00:00`);

  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date
  );
};

const getAllPayments = async () => {
  const [rows] = await db.query(
    `SELECT
        p.PaymentID AS id,
        p.SaleID AS saleId,
        p.PaymentDate AS date,
        p.Amount AS amount,
        p.PaymentMethod AS method,
        s.TotalAmount AS saleTotal,
        s.VendorID AS vendorID,
        v.VendorName AS vendor
     FROM Payments p
     INNER JOIN Sales s ON s.SaleID = p.SaleID
     INNER JOIN Vendors v ON v.VendorID = s.VendorID
     ORDER BY p.PaymentID DESC`
  );

  return rows;
};

const getPaymentsBySale = async (saleID) => {
  const [rows] = await db.query(
    `SELECT
        PaymentID AS id,
        SaleID AS saleId,
        PaymentDate AS date,
        Amount AS amount,
        PaymentMethod AS method
     FROM Payments
     WHERE SaleID = ?
     ORDER BY PaymentID DESC`,
    [saleID]
  );

  return rows;
};

const updateSalePaymentStatus = async (connection, saleID) => {
  const [sales] = await connection.query(
    `SELECT TotalAmount
     FROM Sales
     WHERE SaleID = ?`,
    [saleID]
  );

  if (!sales.length) {
    return;
  }

  const [paymentRows] = await connection.query(
    `SELECT COALESCE(SUM(Amount), 0) AS totalPaid
     FROM Payments
     WHERE SaleID = ?`,
    [saleID]
  );

  const totalPaid = Number(paymentRows[0].totalPaid);
  const saleTotal = Number(sales[0].TotalAmount);

  let status = "UNPAID";

  if (saleTotal > 0 && totalPaid >= saleTotal) {
    status = "PAID";
  } else if (totalPaid > 0) {
    status = "PARTIALLY_PAID";
  }

  await connection.query(
    `UPDATE Sales
     SET PaymentStatus = ?
     WHERE SaleID = ?`,
    [status, saleID]
  );
};

const savePayment = async (payment, paymentID = null) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const saleID = Number(payment.saleId);
    const amount = Number(payment.amount);
    const paymentDate = payment.date;
    const method = String(payment.method || "").trim();

    if (!Number.isInteger(saleID) || saleID <= 0) {
      throw new Error("Please select a valid sale.");
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Payment amount must be greater than zero.");
    }

    if (!isValidDate(paymentDate)) {
      throw new Error("Please provide a valid payment date.");
    }

    if (!validPaymentMethods.includes(method)) {
      throw new Error("Please select a valid payment method.");
    }

    const [sales] = await connection.query(
      `SELECT SaleID, TotalAmount
       FROM Sales
       WHERE SaleID = ?
       FOR UPDATE`,
      [saleID]
    );

    if (!sales.length) {
      throw new Error("The selected sale does not exist.");
    }

    let oldSaleID = null;

    if (paymentID) {
      const [existingPayments] = await connection.query(
        `SELECT PaymentID, SaleID
         FROM Payments
         WHERE PaymentID = ?
         FOR UPDATE`,
        [paymentID]
      );

      if (!existingPayments.length) {
        throw new Error("Payment not found.");
      }

      oldSaleID = Number(existingPayments[0].SaleID);

      if (oldSaleID !== saleID) {
        const [oldSales] = await connection.query(
          `SELECT SaleID
           FROM Sales
           WHERE SaleID = ?
           FOR UPDATE`,
          [oldSaleID]
        );

        if (!oldSales.length) {
          throw new Error("The original sale no longer exists.");
        }
      }
    }

    const [paymentRows] = await connection.query(
      `SELECT COALESCE(SUM(Amount), 0) AS totalPaid
       FROM Payments
       WHERE SaleID = ?
       AND PaymentID != ?`,
      [saleID, paymentID || 0]
    );

    const alreadyPaid = Number(paymentRows[0].totalPaid);
    const saleTotal = Number(sales[0].TotalAmount);
    const remaining = saleTotal - alreadyPaid;

    if (amount > remaining) {
      throw new Error(
        `Payment exceeds the remaining balance of LSL ${remaining.toFixed(2)}.`
      );
    }

    if (paymentID) {
      await connection.query(
        `UPDATE Payments
         SET SaleID = ?,
             PaymentDate = ?,
             Amount = ?,
             PaymentMethod = ?
         WHERE PaymentID = ?`,
        [saleID, paymentDate, amount, method, paymentID]
      );
    } else {
      const [result] = await connection.query(
        `INSERT INTO Payments
         (SaleID, PaymentDate, Amount, PaymentMethod)
         VALUES (?, ?, ?, ?)`,
        [saleID, paymentDate, amount, method]
      );

      paymentID = result.insertId;
    }

    await updateSalePaymentStatus(connection, saleID);

    if (oldSaleID && oldSaleID !== saleID) {
      await updateSalePaymentStatus(connection, oldSaleID);
    }

    await connection.commit();

    return paymentID;

  } catch (error) {
    await connection.rollback();
    throw error;

  } finally {
    connection.release();
  }
};

const createPayment = async (payment) => {
  return savePayment(payment);
};

const updatePayment = async (paymentID, payment) => {
  return savePayment(payment, Number(paymentID));
};

const deletePayment = async (paymentID) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [payments] = await connection.query(
      `SELECT PaymentID, SaleID
       FROM Payments
       WHERE PaymentID = ?
       FOR UPDATE`,
      [paymentID]
    );

    if (!payments.length) {
      throw new Error("Payment not found.");
    }

    const saleID = Number(payments[0].SaleID);

    await connection.query(
      "DELETE FROM Payments WHERE PaymentID = ?",
      [paymentID]
    );

    await updateSalePaymentStatus(connection, saleID);

    await connection.commit();

    return true;

  } catch (error) {
    await connection.rollback();
    throw error;

  } finally {
    connection.release();
  }
};

module.exports = {
  getAllPayments,
  getPaymentsBySale,
  createPayment,
  updatePayment,
  deletePayment
};
