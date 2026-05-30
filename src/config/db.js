const mongoose = require("mongoose");

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        console.warn(
            "MONGO_URI is not set. Starting without a database connection; " +
            "auth and other database-backed features will be unavailable until it is configured."
        );
        return;
    }

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // Mongoose 6+ no longer needs these options, but keeping for clarity
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        // Do not crash the process: keep the server up so health checks and
        // non-database endpoints continue to respond. Database-backed routes
        // will fail until connectivity is restored.
        console.error(`Database connection error: ${err.message}`);
    }
};

module.exports = connectDB;
