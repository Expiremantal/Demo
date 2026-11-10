const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const ctrl = require("../controllers/invoice.controller");

router.get("/",      protect, ctrl.list);
router.get("/:id",   protect, ctrl.get);
router.post("/",     protect, ctrl.create);
router.patch("/:id", protect, ctrl.update);
router.delete("/:id",protect, ctrl.remove);

router.post("/:id/send", protect, ctrl.send);

router.post("/:id/items",           protect, ctrl.addItem);
router.patch("/:id/items/:itemId",  protect, ctrl.updateItem);
router.delete("/:id/items/:itemId", protect, ctrl.removeItem);

router.post("/:id/payments", protect, ctrl.recordPayment);
router.get("/:id/payments",  protect, ctrl.listPayments);

router.post("/:id/documents", protect, ctrl.attachDocument);

module.exports = router;