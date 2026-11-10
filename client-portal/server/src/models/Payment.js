const mongoose = require("mongoose");

/**
 * ERD: Payment
 * A single payment attempt / receipt against an invoice.
 * Supports Stripe, PayFast (SA), or manual EFT.
 */
const paymentSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    client:  { type: mongoose.Schema.Types.ObjectId, ref: "Client",  required: true, index: true },

    paymentNumber: { type: String, required: true },

    method: {
      type: String,
      enum: ["stripe", "payfast", "manual", "eft", "card", "debit_order"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "received", "failed", "refunded"],
      default: "pending",
    },

    amount:   { type: Number, required: true, min: 0 },
    currency: { type: String, default: "ZAR" },

    // Gateway specifics — only the fields for the chosen method are populated
    transactionId:    { type: String, default: null },
    gatewayReference: { type: String, default: null },
    gatewayPayload:   { type: Object, default: null }, // raw webhook body for audit

    paidAt:   { type: Date, default: null },
    notes:    { type: String, default: null },

    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

paymentSchema.index({ organization: 1, paymentNumber: 1 }, { unique: true });
paymentSchema.index({ organization: 1, invoice: 1, status: 1 });

module.exports = mongoose.model("Payment", paymentSchema);