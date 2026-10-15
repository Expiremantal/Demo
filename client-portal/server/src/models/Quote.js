const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema(
    {
        organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
        client:       { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true, index: true },
        number:       { type: String, required: true },
        title:        { type: String, default: "" },
        lineItems: [{
            description: String,
            quantity:    { type: Number, default: 1 },
            unitPrice:   { type: Number, default: 0 },
        }],
        subtotal:     { type: Number, default: 0 },
        tax:          { type: Number, default: 0 },
        total:        { type: Number, default: 0 },
        status:       { type: String, enum: ["draft", "sent", "accepted", "rejected", "expired"], default: "draft" },
        validUntil:   { type: Date, default: null },
        createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Quote", quoteSchema);