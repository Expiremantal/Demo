const mongoose = require("mongoose");

/**
 * ERD: CalendarEvent
 * A scheduled item, optionally linked to a client/request.
 */
const calendarEventSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    calendar: { type: mongoose.Schema.Types.ObjectId, ref: "Calendar", required: true, index: true },

    client:  { type: mongoose.Schema.Types.ObjectId, ref: "Client",  default: null },
    request: { type: mongoose.Schema.Types.ObjectId, ref: "Request", default: null },

    title:       { type: String, required: true, trim: true },
    description: { type: String, default: null },
    location:    { type: String, default: null },

    startsAt: { type: Date, required: true },
    endsAt:   { type: Date, required: true },
    allDay:   { type: Boolean, default: false },

    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

calendarEventSchema.index({ organization: 1, startsAt: 1 });
calendarEventSchema.index({ calendar: 1, startsAt: 1 });

module.exports = mongoose.model("CalendarEvent", calendarEventSchema);