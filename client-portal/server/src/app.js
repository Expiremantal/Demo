// src/app.js
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

const routes = require("./routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// --- Security & parsing ---
app.disable("x-powered-by");
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// --- Logging (dev only) ---
if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
}

// --- Root endpoint (BEFORE routes/notFound) ---
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Client Portal API is running",
    });
});

// --- Routes ---
app.use("/api", routes);

// --- 404 handler (after all routes) ---
app.use(notFound);

// --- Global error handler (must be LAST) ---
app.use(errorHandler);

module.exports = app;