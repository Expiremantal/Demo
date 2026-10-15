const express = require("express");
const router = express.Router();
const Client = require("../models/Client");
const User = require("../models/User");
const { protect } = require("../middleware/auth.middleware");   // ✅ destructured
const { clientScope } = require("../middleware/scope");
const { can } = require("../utils/permissions");

// LIST — automatically scoped
router.get("/", protect, async (req, res, next) => {
    try {
        const clients = await Client.find(clientScope(req.user))
            .populate("assignedTo", "firstName lastName email role");
        res.json({ data: clients });
    } catch (err) {
        next(err);
    }
});

// CREATE — creator becomes owner + first assignee
router.post("/", protect, async (req, res, next) => {
    try {
        if (!can(req.user, "client:create") && !can(req.user, "client:*")) {
            return res.status(403).json({ error: "Forbidden" });
        }
        const client = await Client.create({
            ...req.body,
            organization: req.user.organization,
            owner: req.user._id,
            createdBy: req.user._id,
            assignedTo: [req.user._id],
        });
        res.status(201).json({ data: client });
    } catch (err) {
        next(err);
    }
});

// ASSIGN — only Owner/Admin/Manager
router.post("/:id/assign", protect, async (req, res, next) => {
    try {
        if (!can(req.user, "client:assign") && !can(req.user, "client:*")) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const { userIds } = req.body;
        const client = await Client.findOne({
            _id: req.params.id,
            organization: req.user.organization,
        });
        if (!client) return res.status(404).json({ error: "Client not found" });

        const validUsers = await User.find({
            _id: { $in: userIds },
            organization: req.user.organization,
        }).select("_id");

        client.assignedTo = validUsers.map((u) => u._id);
        await client.save();
        res.json({ data: client });
    } catch (err) {
        next(err);
    }
});

module.exports = router;