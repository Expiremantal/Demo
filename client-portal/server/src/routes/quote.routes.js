const express = require("express");
const router = express.Router();
const Quote = require("../models/Quote");
const Client = require("../models/Client");
const { protect } = require("../middleware/auth.middleware");
const { childScope } = require("../middleware/scope");

router.get("/", protect, async (req, res, next) => {
    try {
        const filter = await childScope(req.user, Client);
        const quotes = await Quote.find(filter)
            .populate("client", "name")
            .sort({ createdAt: -1 });
        res.json({ data: quotes });
    } catch (err) {
        next(err);
    }
});

router.get("/:id", protect, async (req, res, next) => {
    try {
        const filter = await childScope(req.user, Client);
        const quote = await Quote.findOne({ _id: req.params.id, ...filter })
            .populate("client", "name");
        if (!quote) return res.status(404).json({ error: "Quote not found" });
        res.json({ data: quote });
    } catch (err) {
        next(err);
    }
});

router.post("/", protect, async (req, res, next) => {
    try {
        const quote = await Quote.create({
            ...req.body,
            organization: req.user.organization,
            createdBy: req.user._id,
        });
        res.status(201).json({ data: quote });
    } catch (err) {
        next(err);
    }
});

router.patch("/:id", protect, async (req, res, next) => {
    try {
        const filter = await childScope(req.user, Client);
        const quote = await Quote.findOneAndUpdate(
            { _id: req.params.id, ...filter },
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!quote) return res.status(404).json({ error: "Quote not found" });
        res.json({ data: quote });
    } catch (err) {
        next(err);
    }
});

module.exports = router;