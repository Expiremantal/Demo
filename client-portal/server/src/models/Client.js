const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
    {
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },

        // Who created this client
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // 🔑 THE MASTER SWITCH: everyone who can see this client + its data
        assignedTo: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],

        // Basic info
        name:        { type: String, required: true, trim: true },
        email:       { type: String, lowercase: true, trim: true, default: null },
        phone:       { type: String, default: null },
        company:     { type: String, default: null },
        address:     { type: String, default: null },
        notes:       { type: String, default: null },

        // Status
        status: {
            type: String,
            enum: ["active", "inactive", "archived"],
            default: "active",
        },

        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

clientSchema.index({ organization: 1, assignedTo: 1 });
clientSchema.index({ organization: 1, status: 1 });

module.exports = mongoose.model("Client", clientSchema);