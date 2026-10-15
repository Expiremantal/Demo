const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const Client = require("../models/Client");
const { protect } = require("../middleware/auth.middleware");
const { childScope } = require("../middleware/scope");

router.get("/", protect, async (req, res, next) => {
    try {
        const filter = await childScope(req.user, Client);
        const requests = await Request.find(filter)
            .populate("client", "name")
            .populate("assignedTo", "firstName lastName")
            .sort({ createdAt: -1 });
        res.json({ data: requests });
    } catch (err) {
        next(err);
    }
});

router.get("/:id", protect, async (req, res, next) => {
    try {
        const filter = await childScope(req.user, Client);
        const request = await Request.findOne({ _id: req.params.id, ...filter })
            .populate("client", "name");
        if (!request) return res.status(404).json({ error: "Request not found" });
        res.json({ data: request });
    } catch (err) {
        next(err);
    }
});

router.post("/", protect, async (req, res, next) => {
    try {
        const request = await Request.create({
            ...req.body,
            organization: req.user.organization,
            createdBy: req.user._id,
        });
        res.status(201).json({ data: request });
    } catch (err) {
        next(err);
    }
});

router.patch("/:id", protect, async (req, res, next) => {
    try {
        const filter = await childScope(req.user, Client);
        const request = await Request.findOneAndUpdate(
            { _id: req.params.id, ...filter },
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!request) return res.status(404).json({ error: "Request not found" });
        res.json({ data: request });
    } catch (err) {
        next(err);
    }
});

module.exports = router;