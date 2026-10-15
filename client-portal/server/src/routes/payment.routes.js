const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const Client = require("../models/Client");
const { protect } = require("../middleware/auth.middleware");
const { childScope } = require("../middleware/scope");

router.get("/", protect, async (req, res, next) => {
    try {
        const filter = await childScope(req.user, Client);
        const payments = await Payment.find(filter)
            .populate("client", "name")
            .populate("invoice", "number total")
            .sort({ paidAt: -1 });
        res.json({ data: payments });
    } catch (err) {
        next(err);
    }
});

router.get("/:id", protect, async (req, res, next) => {
    try {
        const filter = await childScope(req.user, Client);
        const payment = await Payment.findOne({ _id: req.params.id, ...filter });
        if (!payment) return res.status(404).json({ error: "Payment not found" });
        res.json({ data: payment });
    } catch (err) {
        next(err);
    }
});

router.post("/", protect, async (req, res, next) => {
    try {
        const { invoice: invoiceId, amount, ...rest } = req.body;

        const filter = await childScope(req.user, Client);
        const invoice = await Invoice.findOne({ _id: invoiceId, ...filter });
        if (!invoice) return res.status(404).json({ error: "Invoice not found" });

        const payment = await Payment.create({
            ...rest,
            invoice: invoiceId,
            client: invoice.client,
            amount,
            organization: req.user.organization,
            recordedBy: req.user._id,
        });

        invoice.amountPaid = (invoice.amountPaid || 0) + amount;
        invoice.status = invoice.amountPaid >= invoice.total ? "paid" : "partial";
        await invoice.save();

        res.status(201).json({ data: payment });
    } catch (err) {
        next(err);
    }
});

module.exports = router;