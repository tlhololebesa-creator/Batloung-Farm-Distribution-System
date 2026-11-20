
const { db } = require("../config/db");

const getAllStock = async () => {
    const [rows] = await db.query(`
        SELECT
            Stock.StockID AS id,
            Stock.FruitID AS fruitID,
            Fruits.FruitName AS fruit,
            Stock.PackagingSize AS size,
            Stock.AvailableQuantity AS quantity
        FROM Stock
        INNER JOIN Fruits
        ON Stock.FruitID = Fruits.FruitID
        ORDER BY Stock.StockID DESC
    `);

    return rows;
};

const addStock = async (stock) => {
    const { fruit, size, quantity } = stock;

    const [result] = await db.query(
        `INSERT INTO Stock (FruitID, PackagingSize, AvailableQuantity)
         SELECT FruitID, ?, ?
         FROM Fruits
         WHERE FruitName = ?
         ON DUPLICATE KEY UPDATE
         AvailableQuantity = AvailableQuantity + VALUES(AvailableQuantity)`,
        [size, quantity, fruit]
    );

    return result;
};

const updateStock = async (id, stock) => {
    const { fruit, size, quantity } = stock;

    const [result] = await db.query(
        `UPDATE Stock
         SET
            FruitID = (SELECT FruitID FROM Fruits WHERE FruitName = ?),
            PackagingSize = ?,
            AvailableQuantity = ?
         WHERE StockID = ?
         AND EXISTS (SELECT 1 FROM Fruits WHERE FruitName = ?)`,
        [fruit, size, quantity, id, fruit]
    );

    return result;
};

const deleteStock = async (id) => {
    const [result] = await db.query(
        "DELETE FROM Stock WHERE StockID = ?",
        [id]
    );

    return result;
};

module.exports = {
    getAllStock,
    addStock,
    updateStock,
    deleteStock
};
