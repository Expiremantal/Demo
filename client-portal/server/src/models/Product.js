const mongoose = require("mongoose");

/**
 * ERD: Product
 * Sellable item or service. References Category.
 * `manageStock` gates whether stock fields are enforced.
 */
const productSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },

    sku:  { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    unit: { type: String, default: "each" }, // each, hour, kg, m, etc.

    price:     { type: Number, required: true, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    taxRate:   { type: Number, default: 15 },

    manageStock:   { type: Boolean, default: false },
    stockQuantity: { type: Number, default: 0, min: 0 },
    reorderLevel:  { type: Number, default: 0, min: 0 },

    isActive:  { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

productSchema.index({ organization: 1, sku: 1 }, { unique: true });
productSchema.index({ organization: 1, name: 1 });

module.exports = mongoose.model("Product", productSchema);