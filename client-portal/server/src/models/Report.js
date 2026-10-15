const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
    {
        organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
        client:       { type: mongoose.Schema.Types.ObjectId, ref: "Client", default: null, index: true }, // null = org-wide report
        title:        { type: String, required: true },
        type:         { type: String, enum: ["financial", "activity", "client", "custom"], default: "custom" },
        data:         { type: mongoose.Schema.Types.Mixed, default: {} },
        createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);