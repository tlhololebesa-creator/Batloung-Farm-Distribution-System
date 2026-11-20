const { db } = require("../config/db");

async function getAllSuppliers() {
    const [rows] = await db.query(
        "SELECT * FROM Suppliers ORDER BY SupplierID"
    );

    return rows;
}

async function addSupplier(supplier) {
    const { name, contactPerson, phone, address, province } = supplier;

    const [result] = await db.query(
        `INSERT INTO Suppliers
        (BusinessName, ContactPerson, Phone, Address, Province)
        VALUES (?, ?, ?, ?, ?)`,
        [name, contactPerson, phone, address, province]
    );

    return result.insertId;
}

async function updateSupplier(id, supplier) {
    const { name, contactPerson, phone, address, province } = supplier;

    const [result] = await db.query(
        `UPDATE Suppliers
        SET BusinessName = ?, ContactPerson = ?, Phone = ?,
            Address = ?, Province = ?
        WHERE SupplierID = ?`,
        [name, contactPerson, phone, address, province, id]
    );

    return result.affectedRows;
}

async function deleteSupplier(id) {
    const [result] = await db.query(
        "DELETE FROM Suppliers WHERE SupplierID = ?",
        [id]
    );

    return result.affectedRows;
}

module.exports = {
    getAllSuppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier
};