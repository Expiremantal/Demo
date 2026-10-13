// src/middleware/auth.js
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { verifyAccessToken } = require("../utils/jwt");

exports.protect = async (req, res, next) => {
    try {
        let token;
        const header = req.headers.authorization;

        if (header && header.startsWith("Bearer ")) {
            token = header.split(" ")[1];
        }

        if (!token) throw new ApiError(401, "Authentication required");

        let decoded;
        try {
            decoded = verifyAccessToken(token);
        } catch {
            throw new ApiError(401, "Invalid or expired token");
        }

        const user = await User.findById(decoded.sub);
        if (!user) throw new ApiError(401, "User no longer exists");
        if (!user.isActive) throw new ApiError(403, "Account is disabled");

        req.user = user;
        next();
    } catch (err) {
        next(err);
    }
};

exports.restrictTo = (...roles) => (req, res, next) => {
    if (!req.user) {
        return next(new ApiError(401, "Authentication required"));
    }
    if (!roles.includes(req.user.role)) {
        return next(new ApiError(403, "You do not have permission"));
    }
    next();
};