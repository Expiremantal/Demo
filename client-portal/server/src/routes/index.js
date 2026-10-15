const express = require("express");

const authRoutes = require("./auth.routes");
const clientRoutes = require("./client.routes");
const requestRoutes = require("./request.routes");
const quoteRoutes = require("./quote.routes");
const invoiceRoutes = require("./invoice.routes");
const paymentRoutes = require("./payment.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/clients", clientRoutes);
router.use("/requests", requestRoutes);
router.use("/quotes", quoteRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/payments", paymentRoutes);

module.exports = router;