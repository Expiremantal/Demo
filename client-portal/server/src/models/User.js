const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
    {
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        firstName: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
        lastName:  { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
        email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
        password:  { type: String, required: true, select: false, minlength: 8 },

        role: {
            type: String,
            enum: ["Owner", "Admin", "Manager", "Technician", "Finance", "Client"],
            default: "Client",
        },

        // For Manager → their direct reports (Technicians, Finance, etc.)
        manager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // For Client role → which Client document this user represents
        clientProfile: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            default: null,
        },

        phone: { type: String, default: null },
        isActive: { type: Boolean, default: true },
        emailVerified: { type: Boolean, default: false },
        lastLogin: { type: Date },

        refreshTokens: {
            type: [{
                tokenHash: { type: String, required: true },
                createdAt: { type: Date, default: Date.now },
                expiresAt: { type: Date, required: true },
            }],
            default: [],
            select: false,
        },
    },
    { timestamps: true }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

userSchema.set("toJSON", {
    transform: (doc, ret) => {
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.__v;
        return ret;
    },
});

module.exports = mongoose.model("User", userSchema);