const express = require("express");
const router = express.Router();
const Invoice = require("../models/Invoice");
const Client = require("../models/Client");
const { protect } = require("../middleware/auth.middleware");
const { childScope } = require("../middleware/scope");

router.get("/", protect, async (req, res, next) => {
    try {
        const filter = await childScope(req.user, Client);
        const invoices = await Invoice.find(filter)
            .populate("client", "name")
            .sort({ createdAt: -1 });
        res.json({ data: invoices });
    } catch (err) {
        next(err);
    }
});

router.get("/:id", protect, async (req, res, next) => {
    try {
        const filter = await childScope(req.user, Client);
        const invoice = await Invoice.findOne({ _id: req.params.id, ...filter })
            .populate("client", "name");
        if (!invoice) return res.status(404).json({ error: "Invoice not found" });
        res.json({ data: invoice });
    } catch (err) {
        next(err);
    }
});

router.post("/", protect, async (req, res, next) => {
    try {
        const invoice = await Invoice.create({
            ...req.body,
            organization: req.user.organization,
            createdBy: req.user._id,
        });
        res.status(201).json({ data: invoice });
    } catch (err) {
        next(err);
    }
});

router.patch("/:id", protect, async (req, res, next) => {
    try {
        const filter = await childScope(req.user, Client);
        const invoice = await Invoice.findOneAndUpdate(
            { _id: req.params.id, ...filter },
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!invoice) return res.status(404).json({ error: "Invoice not found" });
        res.json({ data: invoice });
    } catch (err) {
        next(err);
    }
});

module.exports = router;