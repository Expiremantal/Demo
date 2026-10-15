const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        plan: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Organization", organizationSchema);