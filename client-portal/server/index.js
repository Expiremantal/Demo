const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use(express.json());

// Routes
app.use("/api/auth",     require("./routes/auth"));
app.use("/api/clients",  require("./routes/clients"));
app.use("/api/requests", require("./routes/requests"));
app.use("/api/quotes",   require("./routes/quotes"));
app.use("/api/invoices", require("./routes/invoices"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/reports",  require("./routes/reports."));

mongoose.connect(process.env.MONGO_URI).then(() => {
    app.listen(5000, () => console.log("API on :5000"));
});