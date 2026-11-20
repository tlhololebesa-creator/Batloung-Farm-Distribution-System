
const { db } = require("../config/db");

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

const getAllSales = async () => {
  const [rows] = await db.query(
    `SELECT s.SaleID AS id,
            s.VendorID AS vendorID,
            v.VendorName AS vendor,
            s.SaleDate AS saleDate,
            s.PaymentStatus AS paymentStatus,
            s.TotalAmount AS totalAmount
     FROM Sales s
     INNER JOIN Vendors v ON v.VendorID = s.VendorID
     ORDER BY s.SaleID DESC`
  );

  return rows;
};

const getSaleById = async (saleID) => {
  const [rows] = await db.query(
    `SELECT s.SaleID AS id,
            s.VendorID AS vendorID,
            v.VendorName AS vendor,
            s.SaleDate AS saleDate,
            s.PaymentStatus AS paymentStatus,
            s.TotalAmount AS totalAmount
     FROM Sales s
     INNER JOIN Vendors v ON v.VendorID = s.VendorID
     WHERE s.SaleID = ?`,
    [saleID]
  );

  return rows[0] || null;
};

const getSaleDetails = async (saleID) => {
  const [rows] = await db.query(
    `SELECT sd.SalesDetailID AS id,
            sd.SaleID AS saleID,
            sd.FruitID AS fruitID,
            f.FruitName AS fruit,
            sd.PackagingSize AS size,
            sd.Quantity AS quantity,
            sd.UnitPrice AS unitPrice
     FROM SalesDetails sd
     INNER JOIN Fruits f ON f.FruitID = sd.FruitID
     WHERE sd.SaleID = ?
     ORDER BY sd.SalesDetailID`,
    [saleID]
  );

  return rows;
};

const validateSale = async (connection, sale) => {
  const vendorID = Number(sale.vendorID);

  if (!Number.isInteger(vendorID) || vendorID <= 0) {
    throw new Error("Please select a valid vendor.");
  }

  if (!isValidDate(sale.saleDate)) {
    throw new Error("Please provide a valid sale date.");
  }

  if (!Array.isArray(sale.items) || sale.items.length === 0) {
    throw new Error("Please add at least one fruit item.");
  }

  let paymentStatus = String(
    sale.paymentStatus || "UNPAID"
  ).toUpperCase();

  if (paymentStatus === "PARTIAL") {
    paymentStatus = "PARTIALLY_PAID";
  }

  if (!["PAID", "UNPAID", "PARTIALLY_PAID"].includes(paymentStatus)) {
    throw new Error("Invalid payment status.");
  }

  const [vendors] = await connection.query(
    "SELECT VendorID FROM Vendors WHERE VendorID = ?",
    [vendorID]
  );

  if (!vendors.length) {
    throw new Error("The selected vendor does not exist.");
  }

  let totalAmount = 0;
  const items = [];

  for (const item of sale.items) {
    if (!item || typeof item !== "object") {
      throw new Error("Please provide valid fruit item details.");
    }

    const fruitID = Number(item.fruitID);
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    const size = String(item.size || item.packagingSize || "");

    if (!Number.isInteger(fruitID) || fruitID <= 0) {
      throw new Error("Please select a valid fruit.");
    }

    if (!["Small", "Medium", "Large"].includes(size)) {
      throw new Error("Please select a valid packaging size.");
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("Each quantity must be a whole number greater than zero.");
    }

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new Error("Each selling price must be greater than zero.");
    }

    const [fruits] = await connection.query(
      "SELECT FruitID FROM Fruits WHERE FruitID = ?",
      [fruitID]
    );

    if (!fruits.length) {
      throw new Error("One of the selected fruits does not exist.");
    }

    items.push({ fruitID, size, quantity, unitPrice });
    totalAmount += quantity * unitPrice;
  }

  return {
    vendorID,
    saleDate: sale.saleDate,
    paymentStatus,
    items,
    totalAmount
  };
};

const createSale = async (sale) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const cleanSale = await validateSale(connection, sale);

    const requested = new Map();

    cleanSale.items.forEach((item) => {
      const key = `${item.fruitID}-${item.size}`;
      requested.set(key, (requested.get(key) || 0) + item.quantity);
    });

    for (const [key, quantity] of requested.entries()) {
      const [fruitID, size] = key.split("-");

      const [stockRows] = await connection.query(
        `SELECT AvailableQuantity
         FROM Stock
         WHERE FruitID = ? AND PackagingSize = ?
         FOR UPDATE`,
        [fruitID, size]
      );

      const available = Number(stockRows[0]?.AvailableQuantity || 0);

      if (available < quantity) {
        throw new Error(
          `Not enough stock for ${size} packaging. Available: ${available}, requested: ${quantity}.`
        );
      }
    }

    const [saleResult] = await connection.query(
      `INSERT INTO Sales
       (VendorID, SaleDate, PaymentStatus, TotalAmount)
       VALUES (?, ?, ?, ?)`,
      [
        cleanSale.vendorID,
        cleanSale.saleDate,
        cleanSale.paymentStatus,
        cleanSale.totalAmount
      ]
    );

    const saleID = saleResult.insertId;

    for (const item of cleanSale.items) {
      await connection.query(
        `INSERT INTO SalesDetails
         (SaleID, FruitID, PackagingSize, Quantity, UnitPrice)
         VALUES (?, ?, ?, ?, ?)`,
        [
          saleID,
          item.fruitID,
          item.size,
          item.quantity,
          item.unitPrice
        ]
      );

      await connection.query(
        `UPDATE Stock
         SET AvailableQuantity = AvailableQuantity - ?
         WHERE FruitID = ? AND PackagingSize = ?`,
        [item.quantity, item.fruitID, item.size]
      );
    }

    await connection.commit();
    return saleID;

  } catch (error) {
    await connection.rollback();
    throw error;

  } finally {
    connection.release();
  }
};

const updateSale = async (saleID, sale) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const cleanSale = await validateSale(connection, sale);

    const [existingSales] = await connection.query(
      "SELECT SaleID FROM Sales WHERE SaleID = ? FOR UPDATE",
      [saleID]
    );

    if (!existingSales.length) {
      throw new Error("Sale not found.");
    }

    const [oldItems] = await connection.query(
      `SELECT FruitID AS fruitID,
              PackagingSize AS size,
              Quantity AS quantity
       FROM SalesDetails
       WHERE SaleID = ?
       FOR UPDATE`,
      [saleID]
    );

    for (const item of oldItems) {
      await connection.query(
        `INSERT INTO Stock
         (FruitID, PackagingSize, AvailableQuantity)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
         AvailableQuantity = AvailableQuantity + VALUES(AvailableQuantity)`,
        [
          item.fruitID,
          item.size,
          Number(item.quantity)
        ]
      );
    }

    const requested = new Map();

    cleanSale.items.forEach((item) => {
      const key = `${item.fruitID}-${item.size}`;
      requested.set(key, (requested.get(key) || 0) + item.quantity);
    });

    for (const [key, quantity] of requested.entries()) {
      const [fruitID, size] = key.split("-");

      const [stockRows] = await connection.query(
        `SELECT AvailableQuantity
         FROM Stock
         WHERE FruitID = ? AND PackagingSize = ?
         FOR UPDATE`,
        [fruitID, size]
      );

      const available = Number(stockRows[0]?.AvailableQuantity || 0);

      if (available < quantity) {
        throw new Error(
          `Not enough stock for ${size} packaging. Available: ${available}, requested: ${quantity}.`
        );
      }
    }

    await connection.query(
      `UPDATE Sales
       SET VendorID = ?,
           SaleDate = ?,
           PaymentStatus = ?,
           TotalAmount = ?
       WHERE SaleID = ?`,
      [
        cleanSale.vendorID,
        cleanSale.saleDate,
        cleanSale.paymentStatus,
        cleanSale.totalAmount,
        saleID
      ]
    );

    await connection.query(
      "DELETE FROM SalesDetails WHERE SaleID = ?",
      [saleID]
    );

    for (const item of cleanSale.items) {
      await connection.query(
        `INSERT INTO SalesDetails
         (SaleID, FruitID, PackagingSize, Quantity, UnitPrice)
         VALUES (?, ?, ?, ?, ?)`,
        [
          saleID,
          item.fruitID,
          item.size,
          item.quantity,
          item.unitPrice
        ]
      );

      await connection.query(
        `UPDATE Stock
         SET AvailableQuantity = AvailableQuantity - ?
         WHERE FruitID = ? AND PackagingSize = ?`,
        [item.quantity, item.fruitID, item.size]
      );
    }

    await connection.commit();
    return true;

  } catch (error) {
    await connection.rollback();
    throw error;

  } finally {
    connection.release();
  }
};

const deleteSale = async (saleID) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [sales] = await connection.query(
      "SELECT SaleID FROM Sales WHERE SaleID = ? FOR UPDATE",
      [saleID]
    );

    if (!sales.length) {
      throw new Error("Sale not found.");
    }

    const [items] = await connection.query(
      `SELECT FruitID AS fruitID,
              PackagingSize AS size,
              Quantity AS quantity
       FROM SalesDetails
       WHERE SaleID = ?
       FOR UPDATE`,
      [saleID]
    );

    for (const item of items) {
      await connection.query(
        `INSERT INTO Stock
         (FruitID, PackagingSize, AvailableQuantity)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
         AvailableQuantity = AvailableQuantity + VALUES(AvailableQuantity)`,
        [
          item.fruitID,
          item.size,
          Number(item.quantity)
        ]
      );
    }

    await connection.query(
      "DELETE FROM SalesDetails WHERE SaleID = ?",
      [saleID]
    );

    await connection.query(
      "DELETE FROM Sales WHERE SaleID = ?",
      [saleID]
    );

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
  getAllSales,
  getSaleById,
  getSaleDetails,
  createSale,
  updateSale,
  deleteSale
};
