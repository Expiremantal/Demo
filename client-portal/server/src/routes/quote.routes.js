const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const ctrl = require("../controllers/quote.controller");

router.get("/",      protect, ctrl.list);
router.get("/:id",   protect, ctrl.get);
router.post("/",     protect, ctrl.create);
router.patch("/:id", protect, ctrl.update);
router.delete("/:id",protect, ctrl.remove);

router.post("/:id/items",            protect, ctrl.addItem);
router.patch("/:id/items/:itemId",   protect, ctrl.updateItem);
router.delete("/:id/items/:itemId",  protect, ctrl.removeItem);

router.post("/:id/send",             protect, ctrl.send);
router.post("/:id/accept",           protect, ctrl.accept);
router.post("/:id/reject",           protect, ctrl.reject);
router.post("/:id/convert-to-invoice", protect, ctrl.convertToInvoice);

module.exports = router;