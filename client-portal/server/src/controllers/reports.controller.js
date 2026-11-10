// src/controllers/reports.controller.js
const Invoice = require("../models/Invoice");
const Quote = require("../models/Quote");
const Request = require("../models/Request");
const Payment = require("../models/Payment");
const Client = require("../models/Client");
const ApiError = require("../utils/ApiError");
const { can } = require("../utils/permissions");

// GET /api/reports/summary
exports.summary = async (req, res, next) => {
  try {
    if (!can(req.user, "report:read") && !can(req.user, "report:*")) {
      throw new ApiError(403, "Forbidden");
    }
    const org = req.user.organization;
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      invoicesByStatus,
      revenueByMonth,
      topClients,
      requestsByStatus,
      quotesByStatus,
      paymentsTotals,
      clientCount,
    ] = await Promise.all([
      Invoice.aggregate([
        { $match: { organization: org, deletedAt: null } },
        { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$total" } } },
      ]),

      Invoice.aggregate([
        { $match: { organization: org, deletedAt: null, status: "paid", paidAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { y: { $year: "$paidAt" }, m: { $month: "$paidAt" } },
            value: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.y": 1, "_id.m": 1 } },
      ]),

      Invoice.aggregate([
        { $match: { organization: org, deletedAt: null, status: "paid" } },
        { $group: { _id: "$client", revenue: { $sum: "$total" }, invoices: { $sum: 1 } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "clients",
            localField: "_id",
            foreignField: "_id",
            as: "client",
          },
        },
        { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
        { $project: { clientName: "$client.name", revenue: 1, invoices: 1 } },
      ]),

      Request.aggregate([
        { $match: { organization: org, deletedAt: null } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      Quote.aggregate([
        { $match: { organization: org, deletedAt: null } },
        { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$total" } } },
      ]),

      Payment.aggregate([
        { $match: { organization: org, status: "received" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),

      Client.countDocuments({ organization: org, status: "active" }),
    ]);

    res.json({
      data: {
        invoices:      { byStatus: mapify(invoicesByStatus), totalCount: sumField(invoicesByStatus, "count"), totalValue: sumField(invoicesByStatus, "total") },
        quotes:        { byStatus: mapify(quotesByStatus),   totalCount: sumField(quotesByStatus, "count"),   totalValue: sumField(quotesByStatus, "total") },
        requests:      { byStatus: mapify(requestsByStatus), totalCount: sumField(requestsByStatus, "count") },
        payments:      { total: paymentsTotals[0]?.total || 0, count: paymentsTotals[0]?.count || 0 },
        activeClients: clientCount,
        revenueByMonth: revenueByMonth.map((r) => ({
          year: r._id.y,
          month: r._id.m,
          value: r.value,
          count: r.count,
        })),
        topClients: topClients.map((c) => ({
          client: c.clientName || "Unknown",
          revenue: c.revenue,
          invoices: c.invoices,
        })),
      },
    });
  } catch (err) { next(err); }
};

function mapify(arr) {
  const out = {};
  for (const r of arr) out[r._id] = { count: r.count, total: r.total ?? 0 };
  return out;
}
function sumField(arr, field) {
  return arr.reduce((t, r) => t + (r[field] || 0), 0);
}