const mongoose = require("mongoose");

/**
 * ERD: Notification
 * Per-user notification feed. `link` is a client-side route to deep-link.
 */
const notificationSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    type: {
      type: String,
      enum: [
        "quote_sent",
        "quote_accepted",
        "quote_rejected",
        "invoice_sent",
        "invoice_overdue",
        "payment_received",
        "request_assigned",
        "system",
      ],
      default: "system",
    },
    title:   { type: String, required: true },
    message: { type: String, default: null },
    link:    { type: String, default: null }, // e.g. "/invoices/abc123"

    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);