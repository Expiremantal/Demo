// src/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 50,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 50,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
            minlength: 8,
        },
        role: {
            type: String,
            enum: ["Owner", "Admin", "Manager", "Technician", "Finance", "Client"],
            default: "Client",
        },
        phone: {
            type: String,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        lastLogin: {
            type: Date,
        },
        // Each entry: { tokenHash, createdAt, expiresAt }
        refreshTokens: {
            type: [
                {
                    tokenHash: { type: String, required: true },
                    createdAt: { type: Date, default: Date.now },
                    expiresAt: { type: Date, required: true },
                },
            ],
            default: [],
            select: false,
        },
    },
    { timestamps: true }
);

// --- Password hashing ---
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// --- Password comparison ---
userSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

// --- Never leak sensitive fields to JSON ---
userSchema.set("toJSON", {
    transform: (doc, ret) => {
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.__v;
        return ret;
    },
});

module.exports = mongoose.model("User", userSchema);