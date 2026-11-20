
const { db } = require("../config/db");

// 1. Top 5 fruits by sales frequency
const getTopSellingFruits = async () => {
    const [rows] = await db.query(`
        SELECT
            f.FruitID AS fruitID,
            f.FruitName AS fruit,
            SUM(sd.Quantity) AS totalBoxes,
            COUNT(DISTINCT s.SaleID) AS salesFrequency
        FROM SalesDetails sd
        INNER JOIN Fruits f ON f.FruitID = sd.FruitID
        INNER JOIN Sales s ON s.SaleID = sd.SaleID
        GROUP BY f.FruitID, f.FruitName
        ORDER BY salesFrequency DESC, totalBoxes DESC
        LIMIT 5
    `);

    return rows;
};

// 2. Sales revenue within a date range
const getSalesRevenue = async (startDate, endDate) => {
    const [rows] = await db.query(`
        SELECT
            DATE(SaleDate) AS saleDate,
            SUM(TotalAmount) AS totalRevenue
        FROM Sales
        WHERE DATE(SaleDate) BETWEEN ? AND ?
        GROUP BY DATE(SaleDate)
        ORDER BY saleDate
    `, [startDate, endDate]);

    return rows;
};

// 3. Vendor who purchased the highest number of boxes
const getTopVendor = async () => {
    const [rows] = await db.query(`
        SELECT
            v.VendorID AS vendorID,
            v.VendorName AS vendor,
            SUM(sd.Quantity) AS totalBoxes
        FROM Sales s
        INNER JOIN Vendors v ON v.VendorID = s.VendorID
        INNER JOIN SalesDetails sd ON sd.SaleID = s.SaleID
        GROUP BY v.VendorID, v.VendorName
        ORDER BY totalBoxes DESC
        LIMIT 1
    `);

    return rows;
};

// 4. Current stock by fruit and packaging size
const getCurrentStockReport = async () => {
    const [rows] = await db.query(`
        SELECT
            f.FruitID AS fruitID,
            f.FruitName AS fruit,
            st.PackagingSize AS size,
            st.AvailableQuantity AS availableQuantity
        FROM Stock st
        INNER JOIN Fruits f ON f.FruitID = st.FruitID
        ORDER BY f.FruitName, st.PackagingSize
    `);

    return rows;
};

module.exports = {
    getTopSellingFruits,
    getSalesRevenue,
    getTopVendor,
    getCurrentStockReport
};
