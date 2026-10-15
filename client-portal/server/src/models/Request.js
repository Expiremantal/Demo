const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
    {
        organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
        client:       { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true, index: true },
        title:        { type: String, required: true },
        description:  { type: String, default: "" },
        priority:     { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
        status:       { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open" },
        createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        assignedTo:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);