const mongoose = require("mongoose");

/**
 * ERD: Calendar
 * A named calendar (e.g. "Site visits", "Installations").
 */
const calendarSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: null },
    color:       { type: String, default: "#0E7C86" },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Calendar", calendarSchema);