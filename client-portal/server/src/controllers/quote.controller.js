// src/controllers/quote.controller.js
const Quote          = require("../models/Quote");
const QuoteLineItem  = require("../models/QuoteLineItem");
const Client         = require("../models/Client");
const Product        = require("../models/Product");
const Invoice        = require("../models/Invoice");
const InvoiceLineItem= require("../models/InvoiceLineItem");
const { notify } = require("../utils/notify");
const ApiError = require("../utils/ApiError");
const { can }  = require("../utils/permissions");

async function nextQuoteNumber(orgId) {
  const last = await Quote.findOne({ organization: orgId })
    .sort({ createdAt: -1 }).select("quoteNumber").lean();
  let n = 1;
  if (last?.quoteNumber) {
    const m = last.quoteNumber.match(/QT-(\d+)/);
    if (m) n = parseInt(m[1], 10) + 1;
  }
  return `QT-${String(n).padStart(4, "0")}`;
}

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

// Recompute subtotal/tax/total from the quote's line items
async function recalcQuote(quoteId) {
  const items = await QuoteLineItem.find({ quote: quoteId }).lean();
  const subtotal = items.reduce((t, i) => t + i.lineTotal, 0);
  const taxRate  = items[0]?.taxRate ?? 15;
  const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const quote = await Quote.findById(quoteId);
  const discount = quote.discount || 0;
  quote.subtotal  = subtotal;
  quote.taxRate   = taxRate;
  quote.taxAmount = taxAmount;
  quote.total     = subtotal + taxAmount - discount;
  await quote.save();
  return quote;
}

// GET /api/quotes
exports.list = async (req, res, next) => {
  try {
    if (!can(req.user, "quote:read") && !can(req.user, "quote:*")) {
      throw new ApiError(403, "Forbidden");
    }
    const { status, client, q } = req.query;
    const filter = { organization: req.user.organization, deletedAt: null };
    if (status) filter.status = status;
    if (client) filter.client = client;
    if (q) filter.$or = [
      { quoteNumber: { $regex: q, $options: "i" } },
    ];
    const quotes = await Quote.find(filter)
      .populate("client", "name email")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ data: quotes });
  } catch (err) { next(err); }
};

// GET /api/quotes/:id  (with line items)
exports.get = async (req, res, next) => {
  try {
    if (!can(req.user, "quote:read") && !can(req.user, "quote:*")) {
      throw new ApiError(403, "Forbidden");
    }
    const quote = await Quote.findOne({
      _id: req.params.id,
      organization: req.user.organization,
      deletedAt: null,
    }).populate("client", "name email address vatNumber").lean();
    if (!quote) throw new ApiError(404, "Quote not found");

    const lineItems = await QuoteLineItem.find({ quote: quote._id })
      .populate("product", "name sku")
      .sort({ sortOrder: 1 })
      .lean();
    res.json({ data: { ...quote, lineItems } });
  } catch (err) { next(err); }
};

// POST /api/quotes
exports.create = async (req, res, next) => {
  try {
    if (!can(req.user, "quote:*") && !can(req.user, "quote:create")) {
      throw new ApiError(403, "Forbidden");
    }
    const { client, request, notes, expiresAt } = req.body;
    if (!client) throw new ApiError(400, "client is required");

    const clientDoc = await Client.findOne({
      _id: client, organization: req.user.organization,
    });
    if (!clientDoc) throw new ApiError(404, "Client not found");

    const quote = await Quote.create({
      organization: req.user.organization,
      client,
      request: request || null,
      quoteNumber: await nextQuoteNumber(req.user.organization),
      status: "draft",
      notes: notes || null,
      expiresAt: expiresAt || null,
      createdBy: req.user._id,
    });
    res.status(201).json({ data: quote });
  } catch (err) { next(err); }
};

// PATCH /api/quotes/:id
exports.update = async (req, res, next) => {
  try {
    if (!can(req.user, "quote:*") && !can(req.user, "quote:update")) {
      throw new ApiError(403, "Forbidden");
    }
    const allowed = ["notes", "expiresAt", "discount", "taxRate", "client", "request"];
    const update = {};
    for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];
    update.updatedBy = req.user._id;

    const quote = await Quote.findOneAndUpdate(
      { _id: req.params.id, organization: req.user.organization, deletedAt: null, status: "draft" },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!quote) throw new ApiError(404, "Draft quote not found");

    const recalc = await recalcQuote(quote._id);
    res.json({ data: recalc });
  } catch (err) { next(err); }
};

// DELETE /api/quotes/:id  (soft — only drafts)
exports.remove = async (req, res, next) => {
  try {
    if (!can(req.user, "quote:*") && !can(req.user, "quote:delete")) {
      throw new ApiError(403, "Forbidden");
    }
    const quote = await Quote.findOneAndUpdate(
      { _id: req.params.id, organization: req.user.organization, deletedAt: null, status: "draft" },
      { $set: { deletedAt: new Date() } },
      { new: true }
    );
    if (!quote) throw new ApiError(404, "Draft quote not found (only drafts can be deleted)");
    await QuoteLineItem.deleteMany({ quote: quote._id });
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ---------------- LINE ITEMS ----------------

// POST /api/quotes/:id/items
exports.addItem = async (req, res, next) => {
  try {
    if (!can(req.user, "quote:*") && !can(req.user, "quote:update")) {
      throw new ApiError(403, "Forbidden");
    }
    const quote = await Quote.findOne({
      _id: req.params.id, organization: req.user.organization, status: "draft", deletedAt: null,
    });
    if (!quote) throw new ApiError(404, "Draft quote not found");

    const { product, description, quantity, unitPrice, taxRate, sortOrder } = req.body;
    if (!description || quantity == null || unitPrice == null) {
      throw new ApiError(400, "description, quantity, unitPrice are required");
    }
    // If product provided, validate it belongs to the org
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
    const item = await QuoteLineItem.create({
      organization: req.user.organization,
      quote: quote._id,
      product: prodRef,
      description,
      quantity: q,
      unitPrice: up,
      lineTotal: Math.round(q * up * 100) / 100,
      taxRate: Number(taxRate ?? 15),
      sortOrder: Number(sortOrder ?? 0),
    });
    const updated = await recalcQuote(quote._id);
    res.status(201).json({ data: { item, quote: updated } });
  } catch (err) { next(err); }
};

// PATCH /api/quotes/:id/items/:itemId
exports.updateItem = async (req, res, next) => {
  try {
    if (!can(req.user, "quote:*") && !can(req.user, "quote:update")) {
      throw new ApiError(403, "Forbidden");
    }
    const quote = await Quote.findOne({
      _id: req.params.id, organization: req.user.organization, status: "draft", deletedAt: null,
    });
    if (!quote) throw new ApiError(404, "Draft quote not found");

    const item = await QuoteLineItem.findOne({
      _id: req.params.itemId, quote: quote._id,
    });
    if (!item) throw new ApiError(404, "Line item not found");

    const allowed = ["description", "quantity", "unitPrice", "taxRate", "sortOrder"];
    for (const k of allowed) if (req.body[k] !== undefined) item[k] = req.body[k];
    item.quantity  = Number(item.quantity);
    item.unitPrice = Number(item.unitPrice);
    item.lineTotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
    await item.save();

    const updated = await recalcQuote(quote._id);
    res.json({ data: { item, quote: updated } });
  } catch (err) { next(err); }
};

// DELETE /api/quotes/:id/items/:itemId
exports.removeItem = async (req, res, next) => {
  try {
    if (!can(req.user, "quote:*") && !can(req.user, "quote:update")) {
      throw new ApiError(403, "Forbidden");
    }
    const quote = await Quote.findOne({
      _id: req.params.id, organization: req.user.organization, status: "draft", deletedAt: null,
    });
    if (!quote) throw new ApiError(404, "Draft quote not found");

    const item = await QuoteLineItem.findOneAndDelete({
      _id: req.params.itemId, quote: quote._id,
    });
    if (!item) throw new ApiError(404, "Line item not found");

    const updated = await recalcQuote(quote._id);
    res.json({ data: { quote: updated } });
  } catch (err) { next(err); }
};

// ---------------- LIFECYCLE ----------------

// POST /api/quotes/:id/send
exports.send = async (req, res, next) => {
  try {
    if (!can(req.user, "quote:*") && !can(req.user, "quote:send")) {
      throw new ApiError(403, "Forbidden");
    }
    const quote = await Quote.findOne({
      _id: req.params.id, organization: req.user.organization, status: "draft", deletedAt: null,
    });
    if (!quote) throw new ApiError(404, "Draft quote not found");
    const items = await QuoteLineItem.countDocuments({ quote: quote._id });
    if (items === 0) throw new ApiError(400, "Cannot send a quote with no line items");

    quote.status = "sent";
    quote.sentAt = new Date();
    await quote.save();
    await notify({
  organization: req.user.organization,
  user: quote.createdBy,
  type: "quote_sent",
  title: `Quote ${quote.quoteNumber} sent`,
  message: `Quote was sent to the client for approval.`,
  link: `/quotes/${quote._id}`,
});
    res.json({ data: quote });
  } catch (err) { next(err); }
};

// POST /api/quotes/:id/accept
exports.accept = async (req, res, next) => {
  try {
    if (!can(req.user, "quote:*") && !can(req.user, "quote:accept")) {
      throw new ApiError(403, "Forbidden");
    }
    const quote = await Quote.findOne({
      _id: req.params.id, organization: req.user.organization, deletedAt: null,
      status: { $in: ["sent", "viewed"] },
    });
    if (!quote) throw new ApiError(404, "Quote not found or not in a sendable state");
    quote.status = "accepted";
    quote.acceptedAt = new Date();
    await quote.save();
    await notify({
  organization: req.user.organization,
  user: quote.createdBy,
  type: "quote_accepted",
  title: `Quote ${quote.quoteNumber} accepted`,
  message: `Quote was accepted by the client.`,
  link: `/quotes/${quote._id}`,
});
    res.json({ data: quote });
  } catch (err) { next(err); }
};

// POST /api/quotes/:id/reject
exports.reject = async (req, res, next) => {
  try {
    if (!can(req.user, "quote:*") && !can(req.user, "quote:reject")) {
      throw new ApiError(403, "Forbidden");
    }
    const quote = await Quote.findOne({
      _id: req.params.id, organization: req.user.organization, deletedAt: null,
      status: { $in: ["sent", "viewed"] },
    });
    if (!quote) throw new ApiError(404, "Quote not found or not in a rejectable state");
    quote.status = "rejected";
    quote.rejectedAt = new Date();
    await quote.save();
    await notify({
  organization: req.user.organization,
  user: quote.createdBy,
  type: "quote_rejected",
  title: `Quote ${quote.quoteNumber} rejected`,
  message: `Quote was rejected by the client.`,
  link: `/quotes/${quote._id}`,
});
    res.json({ data: quote });
  } catch (err) { next(err); }
};

// POST /api/quotes/:id/convert-to-invoice
exports.convertToInvoice = async (req, res, next) => {
  try {
    if (!can(req.user, "quote:*") && !can(req.user, "quote:convert")) {
      throw new ApiError(403, "Forbidden");
    }
    const quote = await Quote.findOne({
      _id: req.params.id, organization: req.user.organization, deletedAt: null,
      status: "accepted",
    });
    if (!quote) throw new ApiError(404, "Only accepted quotes can be converted");
    if (quote.convertedToInvoice) throw new ApiError(409, "Quote already converted");

    const items = await QuoteLineItem.find({ quote: quote._id }).lean();
    if (items.length === 0) throw new ApiError(400, "Quote has no line items");

    const invoice = await Invoice.create({
      organization: req.user.organization,
      client: quote.client,
      quote: quote._id,
      request: quote.request || null,
      invoiceNumber: await nextInvoiceNumber(req.user.organization),
      status: "draft",
      paymentStatus: "unpaid",
      subtotal: quote.subtotal,
      taxRate: quote.taxRate,
      taxAmount: quote.taxAmount,
      discount: quote.discount,
      total: quote.total,
      amountPaid: 0,
      amountDue: quote.total,
      currency: quote.currency,
      notes: quote.notes,
      createdBy: req.user._id,
    });

    // copy line items
    for (const it of items) {
      await InvoiceLineItem.create({
        organization: req.user.organization,
        invoice: invoice._id,
        product: it.product || null,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        lineTotal: it.lineTotal,
        taxRate: it.taxRate,
        sortOrder: it.sortOrder,
      });
    }

    quote.status = "converted";
    quote.convertedToInvoice = invoice._id;
    await quote.save();

    res.status(201).json({ data: invoice });
  } catch (err) { next(err); }
};