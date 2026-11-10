// src/controllers/invoice.controller.js
const Invoice          = require("../models/Invoice");
const InvoiceLineItem  = require("../models/InvoiceLineItem");
const Client           = require("../models/Client");
const Product          = require("../models/Product");
const Payment          = require("../models/Payment");
const { notify } = require("../utils/notify");
const ApiError = require("../utils/ApiError");
const { can }  = require("../utils/permissions");

async function nextInvoiceNumber(orgId) {
  const last = await Invoice.findOne({ organization: orgId })
    .sort({ createdAt: -1 }).select("invoiceNumber").lean();
  let n = 1;
  if (last?.invoiceNumber) {
    const m = last.invoiceNumber.match(/INV-(\d+)/);
    if (m) n = parseInt(m[1], 10) + 1;
  }
  return `INV-${String(n).padStart(4, "0")}`;
}

async function nextPaymentNumber(orgId) {
  const last = await Payment.findOne({ organization: orgId })
    .sort({ createdAt: -1 }).select("paymentNumber").lean();
  let n = 1;
  if (last?.paymentNumber) {
    const m = last.paymentNumber.match(/PMT-(\d+)/);
    if (m) n = parseInt(m[1], 10) + 1;
  }
  return `PMT-${String(n).padStart(4, "0")}`;
}

// Recompute derived money fields on an invoice from its payments
async function reconcileInvoice(invoiceId) {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) return null;

  const payments = await Payment.find({
    invoice: invoiceId,
    status: "received",
  }).lean();

  const paid = payments.reduce((t, p) => t + p.amount, 0);
  const due  = Math.max(0, invoice.total - paid);

  invoice.amountPaid = Math.round(paid * 100) / 100;
  invoice.amountDue  = Math.round(due  * 100) / 100;

  if (invoice.amountPaid === 0) invoice.paymentStatus = "unpaid";
  else if (invoice.amountDue === 0) invoice.paymentStatus = "paid";
  else invoice.paymentStatus = "partial";

  if (invoice.paymentStatus === "paid" && invoice.status !== "cancelled") {
    invoice.status = "paid";
    if (!invoice.paidAt) invoice.paidAt = new Date();
  } else if (invoice.status === "paid" && invoice.paymentStatus !== "paid") {
    // a refund / void happened after being marked paid
    invoice.status = "sent";
    invoice.paidAt = null;
  }

  await invoice.save();
  return invoice;
}

// Derive "overdue" flag without mutating DB on every read
function decorateOverdue(inv) {
  if (
    inv.status === "sent" &&
    inv.amountDue > 0 &&
    inv.dueDate &&
    new Date(inv.dueDate) < new Date()
  ) {
    return { ...inv, status: "overdue", _wasOverdue: true };
  }
  return inv;
}

// GET /api/invoices
exports.list = async (req, res, next) => {
  try {
    if (!can(req.user, "invoice:read") && !can(req.user, "invoice:*")) {
      throw new ApiError(403, "Forbidden");
    }
    const { status, client, paymentStatus, q } = req.query;
    const filter = { organization: req.user.organization, deletedAt: null };
    if (status) filter.status = status;
    if (client) filter.client = client;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (q) filter.$or = [
      { invoiceNumber: { $regex: q, $options: "i" } },
    ];

    const invoices = await Invoice.find(filter)
      .populate("client", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ data: invoices.map(decorateOverdue) });
  } catch (err) { next(err); }
};

// GET /api/invoices/:id  (with line items + payments)
exports.get = async (req, res, next) => {
  try {
    if (!can(req.user, "invoice:read") && !can(req.user, "invoice:*")) {
      throw new ApiError(403, "Forbidden");
    }
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      organization: req.user.organization,
      deletedAt: null,
    }).populate("client", "name email address vatNumber").lean();
    if (!invoice) throw new ApiError(404, "Invoice not found");

    const [lineItems, payments] = await Promise.all([
      InvoiceLineItem.find({ invoice: invoice._id }).populate("product", "name sku").sort({ sortOrder: 1 }).lean(),
      Payment.find({ invoice: invoice._id }).sort({ createdAt: -1 }).lean(),
    ]);

    res.json({ data: { ...decorateOverdue(invoice), lineItems, payments } });
  } catch (err) { next(err); }
};

// POST /api/invoices  (manual create — not via quote)
exports.create = async (req, res, next) => {
  try {
    if (!can(req.user, "invoice:*") && !can(req.user, "invoice:create")) {
      throw new ApiError(403, "Forbidden");
    }
    const { client, dueDate, notes, taxRate } = req.body;
    if (!client) throw new ApiError(400, "client is required");

    const clientDoc = await Client.findOne({
      _id: client, organization: req.user.organization,
    });
    if (!clientDoc) throw new ApiError(404, "Client not found");

    const invoice = await Invoice.create({
      organization: req.user.organization,
      client,
      invoiceNumber: await nextInvoiceNumber(req.user.organization),
      status: "draft",
      paymentStatus: "unpaid",
      taxRate: Number(taxRate ?? 15),
      dueDate: dueDate || null,
      notes: notes || null,
      createdBy: req.user._id,
    });
    res.status(201).json({ data: invoice });
  } catch (err) { next(err); }
};

// PATCH /api/invoices/:id  (draft only)
exports.update = async (req, res, next) => {
  try {
    if (!can(req.user, "invoice:*") && !can(req.user, "invoice:update")) {
      throw new ApiError(403, "Forbidden");
    }
    const allowed = ["notes", "dueDate", "discount", "taxRate"];
    const update = {};
    for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];
    update.updatedBy = req.user._id;

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, organization: req.user.organization, deletedAt: null, status: "draft" },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!invoice) throw new ApiError(404, "Draft invoice not found");

    res.json({ data: invoice });
  } catch (err) { next(err); }
};

// POST /api/invoices/:id/send  (draft → sent)
exports.send = async (req, res, next) => {
  try {
    if (!can(req.user, "invoice:*") && !can(req.user, "invoice:send")) {
      throw new ApiError(403, "Forbidden");
    }
    const invoice = await Invoice.findOne({
      _id: req.params.id, organization: req.user.organization,
      status: "draft", deletedAt: null,
    });
    if (!invoice) throw new ApiError(404, "Draft invoice not found");

    const itemCount = await InvoiceLineItem.countDocuments({ invoice: invoice._id });
    if (itemCount === 0) throw new ApiError(400, "Cannot send an invoice with no line items");

    invoice.status = "sent";
    invoice.issuedAt = new Date();
    await invoice.save();
    await notify({
  organization: req.user.organization,
  user: invoice.createdBy,
  type: "invoice_sent",
  title: `Invoice ${invoice.invoiceNumber} sent`,
  message: `Invoice was sent to the client.`,
  link: `/invoices/${invoice._id}`,
});
    res.json({ data: invoice });
  } catch (err) { next(err); }
};

// DELETE /api/invoices/:id  (soft — draft only, and only if no payments)
exports.remove = async (req, res, next) => {
  try {
    if (!can(req.user, "invoice:*") && !can(req.user, "invoice:delete")) {
      throw new ApiError(403, "Forbidden");
    }
    const invoice = await Invoice.findOne({
      _id: req.params.id, organization: req.user.organization,
      status: "draft", deletedAt: null,
    });
    if (!invoice) throw new ApiError(404, "Draft invoice not found");

    const paymentCount = await Payment.countDocuments({ invoice: invoice._id, status: "received" });
    if (paymentCount > 0) throw new ApiError(409, "Cannot delete an invoice with recorded payments");

    invoice.deletedAt = new Date();
    await invoice.save();
    await InvoiceLineItem.deleteMany({ invoice: invoice._id });
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ---------------- LINE ITEMS ----------------

exports.addItem = async (req, res, next) => {
  try {
    if (!can(req.user, "invoice:*") && !can(req.user, "invoice:update")) {
      throw new ApiError(403, "Forbidden");
    }
    const invoice = await Invoice.findOne({
      _id: req.params.id, organization: req.user.organization,
      status: "draft", deletedAt: null,
    });
    if (!invoice) throw new ApiError(404, "Draft invoice not found");

    const { product, description, quantity, unitPrice, taxRate, sortOrder } = req.body;
    if (!description || quantity == null || unitPrice == null) {
      throw new ApiError(400, "description, quantity, unitPrice are required");
    }
    let prodRef = null;
    if (product) {
      const prod = await Product.findOne({
        _id: product, organization: req.user.organization, deletedAt: null,
      });
      if (!prod) throw new ApiError(404, "Product not found");
      prodRef = prod._id;
    }
    const q = Number(quantity);
    const up = Number(unitPrice);
    const item = await InvoiceLineItem.create({
      organization: req.user.organization,
      invoice: invoice._id,
      product: prodRef,
      description,
      quantity: q,
      unitPrice: up,
      lineTotal: Math.round(q * up * 100) / 100,
      taxRate: Number(taxRate ?? invoice.taxRate ?? 15),
      sortOrder: Number(sortOrder ?? 0),
    });

    // Recompute money fields (subtotal/tax/total/due)
    await recalcInvoiceMoney(invoice._id);

    const fresh = await Invoice.findById(invoice._id);
    res.status(201).json({ data: { item, invoice: fresh } });
  } catch (err) { next(err); }
};

exports.updateItem = async (req, res, next) => {
  try {
    if (!can(req.user, "invoice:*") && !can(req.user, "invoice:update")) {
      throw new ApiError(403, "Forbidden");
    }
    const invoice = await Invoice.findOne({
      _id: req.params.id, organization: req.user.organization,
      status: "draft", deletedAt: null,
    });
    if (!invoice) throw new ApiError(404, "Draft invoice not found");

    const item = await InvoiceLineItem.findOne({ _id: req.params.itemId, invoice: invoice._id });
    if (!item) throw new ApiError(404, "Line item not found");

    const allowed = ["description", "quantity", "unitPrice", "taxRate", "sortOrder"];
    for (const k of allowed) if (req.body[k] !== undefined) item[k] = req.body[k];
    item.quantity  = Number(item.quantity);
    item.unitPrice = Number(item.unitPrice);
    item.lineTotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
    await item.save();

    await recalcInvoiceMoney(invoice._id);
    const fresh = await Invoice.findById(invoice._id);
    res.json({ data: { item, invoice: fresh } });
  } catch (err) { next(err); }
};

exports.removeItem = async (req, res, next) => {
  try {
    if (!can(req.user, "invoice:*") && !can(req.user, "invoice:update")) {
      throw new ApiError(403, "Forbidden");
    }
    const invoice = await Invoice.findOne({
      _id: req.params.id, organization: req.user.organization,
      status: "draft", deletedAt: null,
    });
    if (!invoice) throw new ApiError(404, "Draft invoice not found");

    const item = await InvoiceLineItem.findOneAndDelete({ _id: req.params.itemId, invoice: invoice._id });
    if (!item) throw new ApiError(404, "Line item not found");

    await recalcInvoiceMoney(invoice._id);
    const fresh = await Invoice.findById(invoice._id);
    res.json({ data: { invoice: fresh } });
  } catch (err) { next(err); }
};

// Recompute subtotal / tax / total / due — does NOT touch payments
async function recalcInvoiceMoney(invoiceId) {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) return null;
  const items = await InvoiceLineItem.find({ invoice: invoiceId }).lean();
  const subtotal = items.reduce((t, i) => t + i.lineTotal, 0);
  const taxAmount = Math.round(subtotal * (invoice.taxRate / 100) * 100) / 100;
  const total = Math.round((subtotal + taxAmount - (invoice.discount || 0)) * 100) / 100;
  invoice.subtotal  = subtotal;
  invoice.taxAmount = taxAmount;
  invoice.total     = total;
  invoice.amountDue = Math.max(0, Math.round((total - invoice.amountPaid) * 100) / 100);
  await invoice.save();
  return invoice;
}

// ---------------- PAYMENTS ----------------

// POST /api/invoices/:id/payments
// Records a manual payment (EFT, cash, etc.). Gateway payments will go through
// /payments/webhooks in a future stage.
exports.recordPayment = async (req, res, next) => {
  try {
    if (!can(req.user, "payment:*") && !can(req.user, "payment:create")) {
      throw new ApiError(403, "Forbidden");
    }
    const invoice = await Invoice.findOne({
      _id: req.params.id, organization: req.user.organization, deletedAt: null,
    });
    if (!invoice) throw new ApiError(404, "Invoice not found");
    if (invoice.status === "cancelled") throw new ApiError(400, "Cannot pay a cancelled invoice");

    const { amount, method, transactionId, gatewayReference, notes, paidAt } = req.body;
    if (amount == null || amount <= 0) throw new ApiError(400, "amount must be > 0");

    const payment = await Payment.create({
      organization: req.user.organization,
      invoice: invoice._id,
      client:  invoice.client,
      paymentNumber: await nextPaymentNumber(req.user.organization),
      method: method || "manual",
      status: "received",
      amount: Number(amount),
      currency: invoice.currency || "ZAR",
      transactionId: transactionId || null,
      gatewayReference: gatewayReference || null,
      paidAt: paidAt ? new Date(paidAt) : new Date(),
      notes: notes || null,
      recordedBy: req.user._id,
    });

    const updated = await reconcileInvoice(invoice._id);
    await notify({
  organization: req.user.organization,
  user: updated.createdBy,
  type: "payment_received",
  title: `Payment received on ${updated.invoiceNumber}`,
  message: `R ${payment.amount.toLocaleString("en-ZA")} recorded via ${payment.method}.`,
  link: `/invoices/${updated._id}`,
});
    res.status(201).json({ data: { payment, invoice: updated } });
  } catch (err) { next(err); }
};

// GET /api/invoices/:id/payments
exports.listPayments = async (req, res, next) => {
  try {
    if (!can(req.user, "payment:read") && !can(req.user, "payment:*") && !can(req.user, "invoice:read")) {
      throw new ApiError(403, "Forbidden");
    }
    const invoice = await Invoice.findOne({
      _id: req.params.id, organization: req.user.organization,
    });
    if (!invoice) throw new ApiError(404, "Invoice not found");

    const payments = await Payment.find({ invoice: invoice._id }).sort({ createdAt: -1 }).lean();
    res.json({ data: payments });
  } catch (err) { next(err); }
};

// ---------------- NOT YET IMPLEMENTED ----------------

// POST /api/invoices/:id/documents  (Stage 7 — Document upload)
exports.attachDocument = async (req, res, next) => {
  next(new ApiError(501, "Document upload — coming in Stage 7"));
};