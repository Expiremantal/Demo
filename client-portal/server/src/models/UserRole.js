const mongoose = require("mongoose");


const userRoleSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
    assignedAt: { type: Date, default: Date.now },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

userRoleSchema.index({ user: 1, role: 1 }, { unique: true });

module.exports = mongoose.model("UserRole", userRoleSchema);