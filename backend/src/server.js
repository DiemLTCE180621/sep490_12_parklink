const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());


// Khai báo các API route của từng chức năng tại đây
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const providerRoutes = require("./routes/providerRoutes");
const facilityRoutes = require("./routes/facilityRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/provider", providerRoutes);
app.use("/api/facilities", facilityRoutes);

// Simple route
app.get("/", (req, res) => {
    res.json({ message: "Welcome to the ParkLink API!" });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        status: "error",
        message: err.message || "Lỗi hệ thống máy chủ"
    });
});

// Start Server
const port = process.env.PORT || 5000;

const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Handle unhandled Promise rejection
process.on("unhandledRejection", (err) => {
    console.error("Lỗi Hệ Thống:", err.message);
    server.close(() => process.exit(1));
});
