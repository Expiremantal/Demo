const express = require("express");

const authRoutes = require("./auth.routes");
const clientRoutes = require("./client.routes");
const requestRoutes = require("./request.routes");
const quoteRoutes = require("./quote.routes");
const invoiceRoutes = require("./invoice.routes");
const paymentRoutes = require("./payment.routes");
const categoryRoutes = require("./category.routes");
const productRoutes  = require("./product.routes");
const router = express.Router();
const notificationRoutes = require("./notification.routes");
const reportRoutes = require("./report.routes");
const userRoutes   = require("./user.routes");


router.use("/auth", authRoutes);
router.use("/clients", clientRoutes);
router.use("/requests", requestRoutes);
router.use("/quotes", quoteRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/payments", paymentRoutes);
router.use("/categories", categoryRoutes);
router.use("/products",   productRoutes);
router.use("/notifications", notificationRoutes);
router.use("/reports", reportRoutes);
router.use("/users", userRoutes);


module.exports = router;