const express = require("express");
const { body, param } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const {
  createEventRequest,
  getAllEventRequests,
  getEventById,
  updateEventStatus,
} = require("../controllers/event.controller");

const router = express.Router();

// PUBLIC — anyone can submit an event order request
router.post(
  "/",
  [
    body("eventName").trim().notEmpty().isLength({ min: 2, max: 200 }).withMessage("Event name required"),
    body("contactPerson").trim().notEmpty().isLength({ min: 2, max: 100 }).withMessage("Contact person required"),
    body("contactNumber").matches(/^[0-9]{10}$/).withMessage("Contact number must be 10 digits"),
    body("contactEmail").optional({ checkFalsy: true }).isEmail().withMessage("Valid email required"),
    body("secondaryContactNumber").optional({ checkFalsy: true }).matches(/^[0-9]{10}$/).withMessage("Secondary number must be 10 digits"),
    body("eventLocation").trim().notEmpty().isLength({ max: 500 }).withMessage("Event location required"),
    body("eventDate").notEmpty().isISO8601().withMessage("Valid event date required"),
    body("deliveryTime").notEmpty().withMessage("Delivery time required"),
    body("guestCount").optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage("Guest count must be positive"),
  ],
  validate,
  createEventRequest
);

// ADMIN — view all event requests
router.get("/", getAllEventRequests);

// ADMIN — view single event
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid event ID")],
  validate,
  getEventById
);

// ADMIN — update event status
router.patch(
  "/:id/status",
  [
    param("id").isMongoId().withMessage("Invalid event ID"),
    body("status")
      .isIn(["NEW", "CONTACTED", "ACCEPTED", "MANUFACTURING", "PACKING", "OUT_FOR_DELIVERY", "COMPLETED", "REJECTED"])
      .withMessage("Invalid status"),
  ],
  validate,
  updateEventStatus
);

module.exports = router;
