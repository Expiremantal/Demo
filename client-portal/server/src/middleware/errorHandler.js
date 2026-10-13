// src/middleware/errorHandler.js
const ApiError = require("../utils/ApiError");

module.exports = (err, req, res, _next) => {
    let error = err;

    // Mongoose: bad ObjectId
    if (err.name === "CastError") {
        error = new ApiError(400, `Invalid ${err.path}: ${err.value}`);
    }

    // Mongoose: duplicate key (e.g. email already exists)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || "field";
        error = new ApiError(409, `Duplicate value for ${field}`);
    }

    // Mongoose: validation
    if (err.name === "ValidationError") {
        const details = Object.values(err.errors).map((e) => e.message);
        error = new ApiError(422, "Validation failed", details);
    }

    const statusCode = error.statusCode || 500;
    const payload = {
        success: false,
        message: error.message || "Internal server error",
    };
    if (error.details) payload.details = error.details;

    // Log non-operational (unexpected) errors with stack
    if (!error.isOperational || statusCode >= 500) {
        console.error("🔥", err);
    }

    if (process.env.NODE_ENV === "development" && statusCode >= 500) {
        payload.stack = err.stack;
    }

    res.status(statusCode).json(payload);
};