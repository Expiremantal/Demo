// server/middleware/auth.middleware.js
const User = require("../models/User");
const UserRole = require("../models/UserRole");
const ApiError = require("../utils/ApiError");
const { verifyAccessToken } = require("../utils/jwt");

exports.protect = async (req, res, next) => {
  try {
    let token;
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) token = header.split(" ")[1];
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

    // Attach DB roles (permissions array) so can() can use them.
    // If none exist yet, can() falls back to ROLE_CAPS[user.role].
    const roles = await UserRole.find({ user: user._id })
      .populate("role", "name permissions")
      .lean();

    // Lean doc + roles array on the request user
    req.user = user.toObject({ virtuals: false });
    req.user.roles = roles;

    next();
  } catch (err) {
    next(err);
  }
};

exports.restrictTo = (...roles) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, "Authentication required"));
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, "You do not have permission"));
  }
  next();
};