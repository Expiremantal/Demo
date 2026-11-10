// src/controllers/notification.controller.js
const Notification = require("../models/Notification");
const ApiError = require("../utils/ApiError");

// Notifications are per-user; no `can()` check needed beyond authentication —
// the `protect` middleware already ensures req.user is the viewer.
// Tenancy is enforced by `organization: req.user.organization` on every query.

// GET /api/notifications?unread=true&limit=20&page=1
exports.list = async (req, res, next) => {
  try {
    const { unread, limit, page } = req.query;
    const filter = {
      organization: req.user.organization,
      user: req.user._id,
    };
    if (unread === "true") filter.isRead = false;

    const lim  = Math.min(parseInt(limit || "20", 10), 100);
    const pg   = Math.max(parseInt(page || "1", 10), 1);
    const skip = (pg - 1) * lim;

    const [items, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({
        organization: req.user.organization,
        user: req.user._id,
        isRead: false,
      }),
    ]);

    res.json({
      data: items,
      meta: { total, page: pg, limit: lim, unreadCount },
    });
  } catch (err) { next(err); }
};

// GET /api/notifications/unread-count  (lightweight for the badge)
exports.unreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      organization: req.user.organization,
      user: req.user._id,
      isRead: false,
    });
    res.json({ data: { count } });
  } catch (err) { next(err); }
};

// PATCH /api/notifications/:id/read
exports.markRead = async (req, res, next) => {
  try {
    const doc = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        organization: req.user.organization,
        user: req.user._id,
      },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );
    if (!doc) throw new ApiError(404, "Notification not found");
    res.json({ data: doc });
  } catch (err) { next(err); }
};

// POST /api/notifications/mark-all-read
exports.markAllRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      {
        organization: req.user.organization,
        user: req.user._id,
        isRead: false,
      },
      { $set: { isRead: true, readAt: new Date() } }
    );
    res.json({ success: true, updated: result.modifiedCount });
  } catch (err) { next(err); }
};

// DELETE /api/notifications/:id
exports.remove = async (req, res, next) => {
  try {
    const doc = await Notification.findOneAndDelete({
      _id: req.params.id,
      organization: req.user.organization,
      user: req.user._id,
    });
    if (!doc) throw new ApiError(404, "Notification not found");
    res.json({ success: true });
  } catch (err) { next(err); }
};