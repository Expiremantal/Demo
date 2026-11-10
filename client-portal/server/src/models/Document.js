const mongoose = require("mongoose");

/**
 * ERD: Document
 * A logical file. Actual bytes live on disk / S3, one per version.
 * `visibleToClient` controls whether the client portal shows it.
 */
const documentSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    // Polymorphic-ish owner — set whichever applies
    client:  { type: mongoose.Schema.Types.ObjectId, ref: "Client",  default: null, index: true },
    request: { type: mongoose.Schema.Types.ObjectId, ref: "Request", default: null },
    quote:   { type: mongoose.Schema.Types.ObjectId, ref: "Quote",   default: null },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", default: null },

    title:       { type: String, required: true, trim: true },
    description: { type: String, default: null },
    category: {
      type: String,
      enum: ["contract", "report", "certificate", "invoice", "quote", "other"],
      default: "other",
    },

    visibleToClient: { type: Boolean, default: false },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);