const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    client:  { type: mongoose.Schema.Types.ObjectId, ref: "Client",  required: true, index: true },
    quote:   { type: mongoose.Schema.Types.ObjectId, ref: "Quote",   default: null },
    request: { type: mongoose.Schema.Types.ObjectId, ref: "Request", default: null },

    invoiceNumber: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue", "cancelled"],
      default: "draft",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid", "refunded"],
      default: "unpaid",
    },

    subtotal:  { type: Number, default: 0 },
    taxRate:   { type: Number, default: 15 },
    taxAmount: { type: Number, default: 0 },
    discount:  { type: Number, default: 0 },
    total:     { type: Number, default: 0 },
    amountPaid:{ type: Number, default: 0 },
    amountDue: { type: Number, default: 0 },
    currency:  { type: String, default: "ZAR" },

    issuedAt: { type: Date, default: null },
    dueDate:  { type: Date, default: null },
    paidAt:   { type: Date, default: null },

    notes: { type: String, default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

invoiceSchema.index({ organization: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ organization: 1, client: 1, status: 1 });
invoiceSchema.index({ organization: 1, dueDate: 1, paymentStatus: 1 });

module.exports = mongoose.model("Invoice", invoiceSchema);