const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const ctrl = require("../controllers/product.controller");

router.get("/",     protect, ctrl.list);
router.get("/:id",  protect, ctrl.get);
router.post("/",    protect, ctrl.create);
router.patch("/:id",protect, ctrl.update);
router.delete("/:id",protect, ctrl.remove);

module.exports = router;