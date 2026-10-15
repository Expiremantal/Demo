const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
        client:       { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true, index: true },
        invoice:      { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
        amount:       { type: Number, required: true },
        method:       { type: String, enum: ["cash", "card", "eft", "other"], default: "eft" },
        reference:    { type: String, default: null },
        paidAt:       { type: Date, default: Date.now },
        recordedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);