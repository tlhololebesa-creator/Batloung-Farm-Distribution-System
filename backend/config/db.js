
const mysql = require("mysql2/promise");
const fs = require("fs");
require("dotenv").config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 4000,
    ssl: {
        ca: process.env.DB_SSL_CA
            ? process.env.DB_SSL_CA.replace(/\\n/g, "\n")
            : fs.readFileSync("C:/Users/Lenovo/Downloads/isrgrootx1.pem")
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testConnection() {
    let connection;

    try {
        connection = await db.getConnection();

        console.log("TiDB database connected successfully!");

        return true;
    } catch (error) {
        console.error("Database connection failed:", error.message);

        return false;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

module.exports = { db, testConnection };
