
const { db } = require("../config/db");

const validSizes = ["Small", "Medium", "Large"];

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

const getAllPurchases = async () => {
    const [rows] = await db.query(`
        SELECT
            Purchases.PurchaseID AS id,
            Purchases.SupplierID AS supplierID,
            Suppliers.BusinessName AS supplier,
            Purchases.PurchaseDate AS purchaseDate,
            Purchases.TotalAmount AS totalAmount
        FROM Purchases
        INNER JOIN Suppliers
            ON Purchases.SupplierID = Suppliers.SupplierID
        ORDER BY Purchases.PurchaseID DESC
    `);

    return rows;
};

const getPurchaseDetails = async (purchaseID) => {
    const [rows] = await db.query(`
        SELECT
            PurchaseDetails.PurchaseDetailID AS id,
            PurchaseDetails.PurchaseID AS purchaseID,
            Fruits.FruitName AS fruit,
            PurchaseDetails.FruitID AS fruitID,
            PurchaseDetails.Quantity AS quantity,
            PurchaseDetails.UnitCost AS unitCost,
            PurchaseDetails.PackagingSize AS size
        FROM PurchaseDetails
        INNER JOIN Fruits
            ON PurchaseDetails.FruitID = Fruits.FruitID
        WHERE PurchaseDetails.PurchaseID = ?
    `, [purchaseID]);

    return rows;
};

const createPurchase = async (purchase) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const { supplierID, purchaseDate, items } = purchase || {};

        const validSupplierID = Number(supplierID);

        if (
            !Number.isInteger(validSupplierID) ||
            validSupplierID <= 0
        ) {
            throw new Error("Please select a valid supplier.");
        }

        if (!isValidDate(purchaseDate)) {
            throw new Error("Please provide a valid purchase date.");
        }

        if (!Array.isArray(items) || items.length === 0) {
            throw new Error("At least one fruit is required.");
        }

        const [suppliers] = await connection.query(
            "SELECT SupplierID FROM Suppliers WHERE SupplierID = ?",
            [validSupplierID]
        );

        if (!suppliers.length) {
            throw new Error("The selected supplier does not exist.");
        }

        let totalAmount = 0;

        for (const item of items) {
            const fruitID = Number(item.fruitID);
            const quantity = Number(item.quantity);
            const unitCost = Number(item.unitCost);

            if (
                !Number.isInteger(fruitID) ||
                fruitID <= 0 ||
                !validSizes.includes(item.size) ||
                !Number.isInteger(quantity) ||
                quantity <= 0 ||
                !Number.isFinite(unitCost) ||
                unitCost <= 0
            ) {
                throw new Error(
                    "Please provide valid fruit, packaging size, quantity and unit cost."
                );
            }

            totalAmount += quantity * unitCost;
        }

        const fruitIDs = [...new Set(items.map(item => Number(item.fruitID)))];

        const [fruits] = await connection.query(
            `SELECT FruitID
             FROM Fruits
             WHERE FruitID IN (${fruitIDs.map(() => "?").join(",")})`,
            fruitIDs
        );

        if (fruits.length !== fruitIDs.length) {
            throw new Error("One or more selected fruits do not exist.");
        }

        const [purchaseResult] = await connection.query(
            `INSERT INTO Purchases (SupplierID, PurchaseDate, TotalAmount)
             VALUES (?, ?, ?)`,
            [validSupplierID, purchaseDate, totalAmount]
        );

        const purchaseID = purchaseResult.insertId;

        for (const item of items) {
            const fruitID = Number(item.fruitID);
            const quantity = Number(item.quantity);
            const unitCost = Number(item.unitCost);

            await connection.query(
                `INSERT INTO PurchaseDetails
                 (PurchaseID, FruitID, Quantity, UnitCost, PackagingSize)
                 VALUES (?, ?, ?, ?, ?)`,
                [purchaseID, fruitID, quantity, unitCost, item.size]
            );

            await connection.query(
                `INSERT INTO Stock (FruitID, PackagingSize, AvailableQuantity)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                 AvailableQuantity = AvailableQuantity + VALUES(AvailableQuantity)`,
                [fruitID, item.size, quantity]
            );
        }

        await connection.commit();

        return {
            purchaseID,
            totalAmount
        };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    getAllPurchases,
    getPurchaseDetails,
    createPurchase
};
