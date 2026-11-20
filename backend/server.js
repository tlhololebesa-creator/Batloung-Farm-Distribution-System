
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { testConnection } = require("./config/db");
const fruitRoutes = require("./routes/fruitRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const stockRoutes = require("./routes/stockRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const salesRoutes = require("./routes/salesRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const reportRoutes = require("./routes/reportRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/fruits", fruitRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Batloung Farm API is connected!"
    });
});

app.get("/", (req, res) => {
    res.send("Batloung Farm Distribution System API is running!");
});

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

async function startServer() {
    const connected = await testConnection();

    if (!connected) {
        console.error("Server started, but database is unavailable. Database operations may fail.");
    }

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer();
