const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const path = require("path");
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Import modules
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const legalRoutes = require("./routes/legalRoutes");

// Initialize Express app
const app = express();

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes'
    }
});

// Static files middleware for serving the UI
app.use(express.static(path.join(__dirname, '../public')));

// Middleware configuration
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Database connection
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/legal", apiLimiter, legalRoutes);

// Serve the main application page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ 
        status: "healthy",
        message: "LegalAI System API is running.",
        timestamp: new Date().toISOString(),
        version: "1.0.0"
    });
});

// API documentation endpoint
app.get("/api", (req, res) => {
    res.json({
        name: "LegalAI API",
        version: "1.0.0",
        description: "Enterprise-level legal research API providing access to federal laws, state laws, constitutional provisions, and case law",
        endpoints: {
            auth: {
                register: "POST /api/auth/register",
                login: "POST /api/auth/login",
                profile: "GET /api/auth/profile"
            },
            legal: {
                research: "POST /api/legal/research - Process legal query and return relevant laws",
                analyze: "GET /api/legal/analyze?q=query - Analyze query without full results",
                states: "GET /api/legal/states - Get all US states",
                constitutionalProvisions: "GET /api/legal/constitutional-provisions - Get constitutional amendments and articles"
            }
        },
        dataSources: {
            federal: "U.S. Code via Cornell LII",
            state: "State laws via Cornell LII (all 50 states)",
            constitutional: "U.S. Constitution via Cornell LII",
            caseLaw: "Supreme Court cases via Cornell LII"
        },
        disclaimer: "This API provides legal information for research purposes only and does not constitute legal advice."
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false,
        error: "Something went wrong!",
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Server startup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n===========================================`);
    console.log(`  LegalAI Server Running`);
    console.log(`  Port: ${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  UI: http://localhost:${PORT}`);
    console.log(`  API: http://localhost:${PORT}/api`);
    console.log(`===========================================\n`);
});
