
const { db } = require("../config/db");

async function getAllFruits() {
    const [rows] = await db.query(
        "SELECT * FROM Fruits ORDER BY FruitID"
    );
    return rows;
}

async function addFruit(fruit) {
    const { name, description, status } = fruit;

    const [result] = await db.query(
        `INSERT INTO Fruits (FruitName, Description, Status)
         VALUES (?, ?, ?)`,
        [name, description || null, status || "Active"]
    );

    return result.insertId;
}

async function updateFruit(id, fruit) {
    const { name, description, status } = fruit;

    const [result] = await db.query(
        `UPDATE Fruits
         SET FruitName = ?, Description = ?, Status = ?
         WHERE FruitID = ?`,
        [name, description || null, status, id]
    );

    return result.affectedRows;
}

async function deleteFruit(id) {
    const [result] = await db.query(
        "DELETE FROM Fruits WHERE FruitID = ?",
        [id]
    );

    return result.affectedRows;
}

module.exports = {
    getAllFruits,
    addFruit,
    updateFruit,
    deleteFruit
};
