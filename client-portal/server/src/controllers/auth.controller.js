// src/controllers/auth.controller.js
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    hashToken,
} = require("../utils/jwt");

const REFRESH_DAYS = 7;

// Helper: issue token pair, persist refresh hash to user
async function issueTokens(user) {
    const accessToken = signAccessToken({
        sub: user._id.toString(),
        role: user.role,
    });

    const refreshToken = signRefreshToken({
        sub: user._id.toString(),
    });

    const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);

    await User.updateOne(
        { _id: user._id },
        {
            $push: {
                refreshTokens: {
                    tokenHash: hashToken(refreshToken),
                    expiresAt,
                },
            },
        }
    );

    return { accessToken, refreshToken };
}

// POST /api/auth/register
exports.register = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;

        const existing = await User.findOne({ email });
        if (existing) {
            throw new ApiError(409, "Email already registered");
        }

        // NOTE: role is intentionally NOT read from req.body.
        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            phone: phone || null,
            role: "Client",
        });

        const { accessToken, refreshToken } = await issueTokens(user);

        res.status(201).json({
            success: true,
            message: "Account created",
            data: {
                user: user.toJSON(),
                accessToken,
                refreshToken,
            },
        });
    } catch (err) {
        next(err);
    }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select("+password");
        if (!user) throw new ApiError(401, "Invalid credentials");

        if (!user.isActive) throw new ApiError(403, "Account is disabled");

        const match = await user.comparePassword(password);
        if (!match) throw new ApiError(401, "Invalid credentials");

        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        const { accessToken, refreshToken } = await issueTokens(user);

        res.json({
            success: true,
            message: "Logged in",
            data: {
                user: user.toJSON(),
                accessToken,
                refreshToken,
            },
        });
    } catch (err) {
        next(err);
    }
};

// POST /api/auth/refresh
exports.refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) throw new ApiError(400, "Refresh token required");

        let decoded;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch {
            throw new ApiError(401, "Invalid or expired refresh token");
        }

        const tokenHash = hashToken(refreshToken);

        const user = await User.findOne({
            _id: decoded.sub,
            "refreshTokens.tokenHash": tokenHash,
        }).select("+refreshTokens");

        if (!user) throw new ApiError(401, "Refresh token not recognized");

        // Remove the old token (rotation)
        user.refreshTokens = user.refreshTokens.filter(
            (t) => t.tokenHash !== tokenHash
        );

        // Clean expired ones
        user.refreshTokens = user.refreshTokens.filter(
            (t) => t.expiresAt > new Date()
        );

        await user.save({ validateBeforeSave: false });

        const tokens = await issueTokens(user);

        res.json({
            success: true,
            message: "Token refreshed",
            data: tokens,
        });
    } catch (err) {
        next(err);
    }
};

// POST /api/auth/logout
exports.logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.json({ success: true, message: "Logged out" });
        }

        const tokenHash = hashToken(refreshToken);
        await User.updateOne(
            { "refreshTokens.tokenHash": tokenHash },
            { $pull: { refreshTokens: { tokenHash } } }
        );

        res.json({ success: true, message: "Logged out" });
    } catch (err) {
        next(err);
    }
};

// GET /api/auth/me  (protected)
exports.me = async (req, res, next) => {
    try {
        // req.user is attached by the `protect` middleware
        res.json({
            success: true,
            data: { user: req.user.toJSON() },
        });
    } catch (err) {
        next(err);
    }
};