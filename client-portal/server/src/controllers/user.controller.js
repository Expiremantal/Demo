// src/controllers/user.controller.js
const User = require("../models/User");
const ApiError = require("../utils/ApiError");

// GET /api/users/me
exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("organization", "name slug plan");
    res.json({ data: user.toJSON() });
  } catch (err) { next(err); }
};

// PATCH /api/users/me
exports.updateMe = async (req, res, next) => {
  try {
    const allowed = ["firstName", "lastName", "phone"];
    const update = {};
    for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: update },
      { returnDocument: "after", runValidators: true }
    ).populate("organization", "name slug plan");

    if (!user) throw new ApiError(404, "User not found");
    res.json({ data: user.toJSON() });
  } catch (err) { next(err); }
};

// PATCH /api/users/me/password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw new ApiError(400, "currentPassword and newPassword are required");
    }
    if (newPassword.length < 8) {
      throw new ApiError(400, "New password must be at least 8 characters");
    }
    const user = await User.findById(req.user._id).select("+password");
    if (!user) throw new ApiError(404, "User not found");

    const match = await user.comparePassword(currentPassword);
    if (!match) throw new ApiError(401, "Current password is incorrect");

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: "Password updated" });
  } catch (err) { next(err); }
};