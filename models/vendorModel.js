
const { db } = require("../config/db");

const getAllVendors = async () => {
  const sql = `
    SELECT
      v.VendorID,
      v.VendorName,
      v.PhoneNumber,
      v.Location,
      v.RegistrationDate,
      COALESCE(SUM(s.TotalAmount), 0) AS totalSales,
      COALESCE(SUM(COALESCE(paid.totalPaid, 0)), 0) AS totalPaid,
      COALESCE(SUM(s.TotalAmount - COALESCE(paid.totalPaid, 0)), 0) AS outstandingBalance
    FROM Vendors v
    LEFT JOIN Sales s ON s.VendorID = v.VendorID
    LEFT JOIN (
      SELECT SaleID, SUM(Amount) AS totalPaid
      FROM Payments
      GROUP BY SaleID
    ) paid ON paid.SaleID = s.SaleID
    GROUP BY
      v.VendorID,
      v.VendorName,
      v.PhoneNumber,
      v.Location,
      v.RegistrationDate
    ORDER BY v.VendorID DESC
  `;

  const [results] = await db.query(sql);
  return results;
};

const searchVendors = async (searchTerm) => {
  const sql = `
    SELECT
      v.VendorID,
      v.VendorName,
      v.PhoneNumber,
      v.Location,
      v.RegistrationDate,
      COALESCE(SUM(s.TotalAmount), 0) AS totalSales,
      COALESCE(SUM(COALESCE(paid.totalPaid, 0)), 0) AS totalPaid,
      COALESCE(SUM(s.TotalAmount - COALESCE(paid.totalPaid, 0)), 0) AS outstandingBalance
    FROM Vendors v
    LEFT JOIN Sales s ON s.VendorID = v.VendorID
    LEFT JOIN (
      SELECT SaleID, SUM(Amount) AS totalPaid
      FROM Payments
      GROUP BY SaleID
    ) paid ON paid.SaleID = s.SaleID
    WHERE v.VendorName LIKE ? OR v.PhoneNumber LIKE ?
    GROUP BY
      v.VendorID,
      v.VendorName,
      v.PhoneNumber,
      v.Location,
      v.RegistrationDate
    ORDER BY v.VendorID DESC
  `;

  const searchValue = `%${searchTerm}%`;
  const [results] = await db.query(sql, [searchValue, searchValue]);

  return results;
};

const addVendor = async (vendor) => {
  const sql = `
    INSERT INTO Vendors (VendorName, PhoneNumber, Location, RegistrationDate)
    VALUES (?, ?, ?, ?)
  `;

  const [result] = await db.query(sql, [
    vendor.name,
    vendor.phone,
    vendor.location,
    vendor.registrationDate,
  ]);

  return result;
};

const updateVendor = async (id, vendor) => {
  const sql = `
    UPDATE Vendors
    SET VendorName = ?, PhoneNumber = ?, Location = ?, RegistrationDate = ?
    WHERE VendorID = ?
  `;

  const [result] = await db.query(sql, [
    vendor.name,
    vendor.phone,
    vendor.location,
    vendor.registrationDate,
    id,
  ]);

  return result;
};

const deleteVendor = async (id) => {
  const sql = "DELETE FROM Vendors WHERE VendorID = ?";
  const [result] = await db.query(sql, [id]);
  return result;
};

module.exports = {
  getAllVendors,
  searchVendors,
  addVendor,
  updateVendor,
  deleteVendor,
};
