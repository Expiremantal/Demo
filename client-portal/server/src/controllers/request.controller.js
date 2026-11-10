// src/controllers/request.controller.js
const Request = require("../models/Request");
const Client  = require("../models/Client");
const ApiError = require("../utils/ApiError");
const { can }  = require("../utils/permissions");
const { notify } = require("../utils/notify");

// Helper: generate next RQ-XXX for this org
async function nextRequestNumber(orgId) {
  const last = await Request.findOne({ organization: orgId })
    .sort({ createdAt: -1 })
    .select("requestNumber")
    .lean();
  let n = 1;
  if (last?.requestNumber) {
    const m = last.requestNumber.match(/RQ-(\d+)/);
    if (m) n = parseInt(m[1], 10) + 1;
  }
  return `RQ-${String(n).padStart(3, "0")}`;
}

// GET /api/requests
exports.list = async (req, res, next) => {
  try {
    if (!can(req.user, "request:read") && !can(req.user, "request:*")) {
      throw new ApiError(403, "Forbidden");
    }
    const { status, client, priority, q } = req.query;
    const filter = { organization: req.user.organization, deletedAt: null };
    if (status) filter.status = status;
    if (client) filter.client = client;
    if (priority) filter.priority = priority;
    if (q) filter.$or = [
      { title:       { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { requestNumber: { $regex: q, $options: "i" } },
    ];

    const requests = await Request.find(filter)
      .populate("client", "name email")
      .populate("assignedTo", "firstName lastName email")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ data: requests });
  } catch (err) { next(err); }
};

// GET /api/requests/:id
exports.get = async (req, res, next) => {
  try {
    if (!can(req.user, "request:read") && !can(req.user, "request:*")) {
      throw new ApiError(403, "Forbidden");
    }
    const doc = await Request.findOne({
      _id: req.params.id,
      organization: req.user.organization,
      deletedAt: null,
    })
      .populate("client", "name email phone address")
      .populate("assignedTo", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .lean();
    if (!doc) throw new ApiError(404, "Request not found");
    res.json({ data: doc });
  } catch (err) { next(err); }
};

// POST /api/requests
exports.create = async (req, res, next) => {
  try {
    if (!can(req.user, "request:*") && !can(req.user, "request:create")) {
      throw new ApiError(403, "Forbidden");
    }
    const { client, title, description, priority, dueDate, assignedTo } = req.body;
    if (!client || !title) throw new ApiError(400, "client and title are required");

    const clientDoc = await Client.findOne({
      _id: client,
      organization: req.user.organization,
    });
    if (!clientDoc) throw new ApiError(404, "Client not found");

    const doc = await Request.create({
      organization: req.user.organization,
      client,
      requestNumber: await nextRequestNumber(req.user.organization),
      title: title.trim(),
      description: description || null,
      priority: priority || "normal",
      status: "pending",
      assignedTo: assignedTo || null,
      dueDate: dueDate || null,
      createdBy: req.user._id,
    });
    if (doc.assignedTo) {
  await notify({
    organization: req.user.organization,
    user: doc.assignedTo,
    type: "request_assigned",
    title: `New request: ${doc.title}`,
    message: `You were assigned ${doc.requestNumber}.`,
    link: `/requests/${doc._id}`,
  });
}
    res.status(201).json({ data: doc });
  } catch (err) { next(err); }
};

// PATCH /api/requests/:id
exports.update = async (req, res, next) => {
  try {
    if (!can(req.user, "request:*") && !can(req.user, "request:update")) {
      throw new ApiError(403, "Forbidden");
    }
    const allowed = ["title", "description", "priority", "status", "assignedTo", "dueDate"];
    const update = {};
    for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];

    // Stamp resolvedAt when status flips to resolved
    if (update.status === "resolved") update.resolvedAt = new Date();

    const doc = await Request.findOneAndUpdate(
      { _id: req.params.id, organization: req.user.organization, deletedAt: null },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!doc) throw new ApiError(404, "Request not found");
    res.json({ data: doc });
  } catch (err) { next(err); }
};

// DELETE /api/requests/:id (soft)
exports.remove = async (req, res, next) => {
  try {
    if (!can(req.user, "request:*") && !can(req.user, "request:delete")) {
      throw new ApiError(403, "Forbidden");
    }
    const doc = await Request.findOneAndUpdate(
      { _id: req.params.id, organization: req.user.organization, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true }
    );
    if (!doc) throw new ApiError(404, "Request not found");
    res.json({ success: true });
  } catch (err) { next(err); }
};