const mongoose = require("mongoose");

const quoteLineItemSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    quote: { type: mongoose.Schema.Types.ObjectId, ref: "Quote", required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },

    description: { type: String, required: true },
    quantity:    { type: Number, required: true, min: 0 },
    unitPrice:   { type: Number, required: true, min: 0 },
    lineTotal:   { type: Number, required: true, min: 0 },
    taxRate:     { type: Number, default: 15 },
    sortOrder:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuoteLineItem", quoteLineItemSchema);