// src/controllers/auth.controller.js
const User = require("../models/User");
const Organization = require("../models/Organization");
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
        organization: user.organization?.toString(),
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

// Helper: turn "My Company" → "my-company-4f2a"
function slugify(name) {
    const base = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    const suffix = Math.random().toString(36).slice(2, 6);
    return `${base}-${suffix}`;
}

// POST /api/auth/register
// First user of a new company → creates Organization + is Owner
exports.register = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, phone, companyName } = req.body;

        if (!companyName) {
            throw new ApiError(400, "companyName is required");
        }

        const existing = await User.findOne({ email });
        if (existing) {
            throw new ApiError(409, "Email already registered");
        }

        // 1. Create the organization
        //    Owner field is set after we create the user (circular ref), so:
        //    — create user first with a placeholder, then set org.owner
        //    OR — create org without owner, then set both. We'll do the latter.
        const org = await Organization.create({
            name: companyName,
            slug: slugify(companyName),
            owner: new (require("mongoose").Types.ObjectId)(), // temp, set below
        });

        // 2. Create the owner user
        const user = await User.create({
            organization: org._id,
            firstName,
            lastName,
            email,
            password,
            phone: phone || null,
            role: "Owner",              // 🎯 first user is Owner
        });

        // 3. Now link org.owner to the real user
        org.owner = user._id;
        await org.save();

        // 4. Issue tokens
        const { accessToken, refreshToken } = await issueTokens(user);

        res.status(201).json({
            success: true,
            message: "Account and organization created",
            data: {
                user: user.toJSON(),
                organization: {
                    _id: org._id,
                    name: org.name,
                    slug: org.slug,
                },
                accessToken,
                refreshToken,
            },
        });
    } catch (err) {
        next(err);
    }
};

// POST /api/auth/login  (unchanged, but populate org)
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email })
            .select("+password")
            .populate("organization", "name slug plan");

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

// POST /api/auth/refresh  (unchanged)
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

        user.refreshTokens = user.refreshTokens.filter(
            (t) => t.tokenHash !== tokenHash && t.expiresAt > new Date()
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

// POST /api/auth/logout  (unchanged)
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

// GET /api/auth/me  (protected) — now populates organization
exports.me = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).populate(
            "organization",
            "name slug plan"
        );
        res.json({
            success: true,
            data: { user: user.toJSON() },
        });
    } catch (err) {
        next(err);
    }
};