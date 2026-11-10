const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      enum: ["Owner", "Admin", "Manager", "Technician", "Finance", "Client"],
    },
    description: { type: String, default: null },
    permissions: {
      type: [String], // e.g. "client:*", "invoice:read"
      default: [],
    },
    isSystem: { type: Boolean, default: true }, // true = seeded, cannot delete
  },
  { timestamps: true }
);

roleSchema.index({ organization: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Role", roleSchema);