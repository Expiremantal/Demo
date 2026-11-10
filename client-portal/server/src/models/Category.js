const mongoose = require("mongoose");

/**
 * ERD: Category
 * Groups products (e.g. "Pumps", "Fittings", "Labour").
 */
const categorySchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: null },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null, // supports sub-categories; null = top-level
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.index({ organization: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);