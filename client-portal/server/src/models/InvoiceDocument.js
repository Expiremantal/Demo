const mongoose = require("mongoose");

/**
 * ERD: InvoiceDocument
 * Rendered PDF or uploaded proof — one or many per invoice.
 * Points to Document for the actual file bytes.
 */
const invoiceDocumentSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    invoice:  { type: mongoose.Schema.Types.ObjectId, ref: "Invoice",  required: true, index: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true },

    type: {
      type: String,
      enum: ["invoice_pdf", "proof_of_payment", "credit_note", "other"],
      default: "invoice_pdf",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InvoiceDocument", invoiceDocumentSchema);