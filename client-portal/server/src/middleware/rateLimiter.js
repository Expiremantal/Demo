// src/middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");

exports.loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 10,
    message: {
        success: false,
        message: "Too many login attempts. Try again in 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

exports.registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    message: {
        success: false,
        message: "Too many accounts created from this IP. Try again later.",
    },
});