const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Import modules
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

// Initialize Express app
const app = express();

// Middleware configuration
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Database connection
connectDB();

// Routes
app.use("/api/auth", authRoutes);

// Health check endpoint
app.get("/", (req, res) => {
    res.json({ message: "Legal System API is running." });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});

// Server startup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
