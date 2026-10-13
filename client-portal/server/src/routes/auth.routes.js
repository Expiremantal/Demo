// src/routes/auth.routes.js
const express = require("express");
const router = express.Router();

const {
    registerValidation,
    loginValidation,
    validate,
} = require("../validators/auth.validator");

const authController = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimiter");

router.post(
    "/register",
    registerLimiter,
    registerValidation,
    validate,
    authController.register
);
router.post("/login", loginLimiter, loginValidation, validate, authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", protect, authController.me);

module.exports = router;