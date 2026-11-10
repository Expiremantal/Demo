const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const ctrl = require("../controllers/reports.controller");

router.get("/summary", protect, ctrl.summary);

module.exports = router;