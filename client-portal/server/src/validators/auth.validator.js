// src/validators/auth.validator.js
const { body, validationResult } = require("express-validator");

// --- Reusable field rules ---

const nameRule = (field) =>
    body(field)
        .trim()
        .escape()
        .notEmpty()
        .withMessage(`${field} is required`)
        .bail()
        .isLength({ min: 2, max: 50 })
        .withMessage(`${field} must be between 2 and 50 characters`)
        .bail()
        .matches(/^[A-Za-z\s'-]+$/)
        .withMessage(`${field} contains invalid characters`);

const emailRule = body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isLength({ max: 254 })
    .withMessage("Email is too long")
    .bail()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail();

const passwordRule = body("password")
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be 8–128 characters")
    .bail()
    .matches(/[A-Z]/)
    .withMessage("Password must contain an uppercase letter")
    .bail()
    .matches(/[a-z]/)
    .withMessage("Password must contain a lowercase letter")
    .bail()
    .matches(/[0-9]/)
    .withMessage("Password must contain a number")
    .bail()
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Password must contain a special character");

const phoneRule = body("phone")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^\+?[0-9\s()-]{7,20}$/)
    .withMessage("Invalid phone number");

// --- Route-specific chains ---

// NOTE: `role` is intentionally NOT accepted here.
// Role assignment is an authorization concern — only Owner/Admin can change it later.
const registerValidation = [
    nameRule("firstName"),
    nameRule("lastName"),
    emailRule,
    passwordRule,
    phoneRule,
];

const loginValidation = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .bail()
        .isEmail()
        .withMessage("Invalid email")
        .normalizeEmail(),
    body("password")
        .notEmpty()
        .withMessage("Password is required"),
];

// --- Central error collector ---
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formatted = {};
        errors.array().forEach((e) => {
            if (!formatted[e.path]) formatted[e.path] = e.msg;
        });

        return res.status(422).json({
            success: false,
            message: "Validation failed",
            errors: formatted,
        });
    }
    next();
};

module.exports = {
    registerValidation,
    loginValidation,
    validate,
};