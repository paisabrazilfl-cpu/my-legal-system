const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * User schema definition
 */
const userSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: [true, "Email is required"], 
        unique: true,
        lowercase: true,
        trim: true
    },
    password: { 
        type: String, 
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters"]
    },
    role: { 
        type: String, 
        default: "user",
        enum: ["user", "admin"]
    }
}, {
    timestamps: true
});

/**
 * Pre-save middleware to hash password
 */
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    
    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (err) {
        next(err);
    }
});

/**
 * Method to compare passwords
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
