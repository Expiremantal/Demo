const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
    {
        organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
        client:       { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true, index: true },
        quote:        { type: mongoose.Schema.Types.ObjectId, ref: "Quote", default: null },
        number:       { type: String, required: true },
        lineItems: [{
            description: String,
            quantity:    { type: Number, default: 1 },
            unitPrice:   { type: Number, default: 0 },
        }],
        subtotal:     { type: Number, default: 0 },
        tax:          { type: Number, default: 0 },
        total:        { type: Number, default: 0 },
        amountPaid:   { type: Number, default: 0 },
        status:       { type: String, enum: ["draft", "sent", "paid", "partial", "overdue", "void"], default: "draft" },
        dueDate:      { type: Date, default: null },
        createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);