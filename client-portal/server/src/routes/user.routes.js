const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const ctrl = require("../controllers/user.controller");

router.get("/me",            protect, ctrl.me);
router.patch("/me",          protect, ctrl.updateMe);
router.patch("/me/password", protect, ctrl.changePassword);

module.exports = router;