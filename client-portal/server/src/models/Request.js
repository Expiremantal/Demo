const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    requestNumber: { type: String, required: true },
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: null },

    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved", "rejected", "closed"],
      default: "pending",
    },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    dueDate:    { type: Date, default: null },
    resolvedAt: { type: Date, default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

requestSchema.index({ organization: 1, requestNumber: 1 }, { unique: true });
requestSchema.index({ organization: 1, client: 1, status: 1 });

module.exports = mongoose.model("Request", requestSchema);