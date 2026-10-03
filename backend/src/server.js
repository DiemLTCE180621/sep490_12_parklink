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
const reservationRoutes = require("./routes/reservationRoutes");
const webhookRoutes = require("./routes/webhookRoutes");

app.use("/api/reservations", reservationRoutes);
app.use("/api/webhook", webhookRoutes);

const reviewRoutes = require("./routes/reviewRoutes");
app.use("/api/reviews", reviewRoutes);

const chatRoutes = require("./routes/chatRoutes");
app.use("/api/chats", chatRoutes);

const uploadRoutes = require("./routes/uploadRoutes");
app.use("/api/uploads", uploadRoutes);

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

// Initialize Socket.io
const { initSocket } = require("./config/socket");
initSocket(server);

// Handle unhandled Promise rejection
process.on("unhandledRejection", (err) => {
    console.error("Lỗi Hệ Thống:", err.message);
    server.close(() => process.exit(1));
});
