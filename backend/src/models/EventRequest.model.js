const mongoose = require("mongoose");

const eventRequestSchema = new mongoose.Schema(
  {
    // ── Event Info ──
    eventName: { type: String, required: true, trim: true },
    eventType: { type: String, trim: true }, // Wedding, Birthday, Corporate, etc.
    eventDate: { type: Date, required: true, index: true },
    eventTime: { type: String, trim: true, default: "00:00" },
    deliveryTime: { type: String, required: true, trim: true },
    eventLocation: { type: String, required: true, trim: true },
    guestCount: { type: Number, min: 1 },

    // ── Primary Contact ──
    contactPerson: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },

    // ── Secondary Contact ──
    secondaryContactPerson: { type: String, trim: true },
    secondaryContactNumber: { type: String, trim: true },
    secondaryContactRelation: { type: String, trim: true }, // e.g. "Bride's Father", "Event Manager"

    // ── Order Details ──
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        productName: { type: String, required: true },
        approximateQuantity: { type: Number, required: true },
        unit: { type: String },
      },
    ],
    specialInstructions: { type: String, trim: true },
    budgetRange: { type: String, trim: true }, // e.g. "₹5,000 - ₹10,000"
    howDidYouHear: { type: String, trim: true }, // Referral source

    // ── Status ──
    status: {
      type: String,
      enum: ["NEW", "CONTACTED", "ACCEPTED", "MANUFACTURING", "PACKING", "OUT_FOR_DELIVERY", "COMPLETED", "REJECTED"],
      default: "NEW",
      index: true,
    },
    adminNotes: { type: String, trim: true },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        notes: String,
      },
    ],
  },
  { timestamps: true }
);

eventRequestSchema.index({ status: 1, eventDate: 1 });
eventRequestSchema.index({ eventDate: 1, status: 1 });

module.exports = mongoose.model("EventRequest", eventRequestSchema);
