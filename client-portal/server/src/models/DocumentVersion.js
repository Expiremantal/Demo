const mongoose = require("mongoose");

/**
 * ERD: DocumentVersion
 * One row per upload of a Document. Latest version = highest `version`.
 */
const documentVersionSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    document: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true, index: true },

    version:      { type: Number, required: true, min: 1 },
    storagePath:  { type: String, required: true }, // local path or S3 key
    fileName:     { type: String, required: true },
    mimeType:     { type: String, default: "application/octet-stream" },
    sizeBytes:    { type: Number, default: 0 },
    checksum:     { type: String, default: null }, // sha256 for dedupe

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

documentVersionSchema.index({ document: 1, version: 1 }, { unique: true });

module.exports = mongoose.model("DocumentVersion", documentVersionSchema);