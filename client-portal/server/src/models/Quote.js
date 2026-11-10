const mongoose = require("mongoose");


const quoteSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    client:  { type: mongoose.Schema.Types.ObjectId, ref: "Client",  required: true, index: true },
    request: { type: mongoose.Schema.Types.ObjectId, ref: "Request", default: null },

    quoteNumber: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "sent", "viewed", "accepted", "rejected", "expired", "converted"],
      default: "draft",
    },

    // Monetary — always ZAR; store cents as integers where possible
    subtotal:  { type: Number, default: 0 },
    taxRate:   { type: Number, default: 15 },     // SA VAT
    taxAmount: { type: Number, default: 0 },
    discount:  { type: Number, default: 0 },
    total:     { type: Number, default: 0 },
    currency:  { type: String, default: "ZAR" },

    notes: { type: String, default: null },

    issuedAt:  { type: Date, default: null },
    sentAt:    { type: Date, default: null },
    viewedAt:  { type: Date, default: null },
    acceptedAt:{ type: Date, default: null },
    rejectedAt:{ type: Date, default: null },
    expiresAt: { type: Date, default: null },
    convertedToInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

quoteSchema.index({ organization: 1, quoteNumber: 1 }, { unique: true });
quoteSchema.index({ organization: 1, client: 1, status: 1 });

module.exports = mongoose.model("Quote", quoteSchema);