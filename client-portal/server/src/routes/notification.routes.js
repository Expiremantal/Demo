const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const ctrl = require("../controllers/notification.controller");

router.get("/",                protect, ctrl.list);
router.get("/unread-count",    protect, ctrl.unreadCount);
router.patch("/:id/read",      protect, ctrl.markRead);
router.post("/mark-all-read",  protect, ctrl.markAllRead);
router.delete("/:id",          protect, ctrl.remove);

module.exports = router;