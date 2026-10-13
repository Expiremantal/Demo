// src/config/db.js
const mongoose = require("mongoose");

async function connectDB() {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
        return conn;
    } catch (err) {
        console.error("❌ MongoDB connection failed");
        console.error(err.message);
        throw err;
    }
}

async function disconnectDB() {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
}

module.exports = { connectDB, disconnectDB };