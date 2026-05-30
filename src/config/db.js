const mongoose = require("mongoose");

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // Mongoose 6+ no longer needs these options, but keeping for clarity
        });
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`Database connection error: ${err.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
