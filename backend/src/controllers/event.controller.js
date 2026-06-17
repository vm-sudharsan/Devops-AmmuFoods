const EventRequest = require("../models/EventRequest.model");
const { sendMail } = require("../services/mail.service");
const { appendToSheet } = require("../services/sheets.service");

// ── Submit event order request (public) ──
const createEventRequest = async (req, res) => {
  try {
    const {
      eventName, eventType, eventDate, deliveryTime, eventLocation, guestCount,
      contactPerson, contactNumber, contactEmail,
      secondaryContactPerson, secondaryContactNumber, secondaryContactRelation,
      itemsRequired, productsPayload,
      specialInstructions, budgetRange, howDidYouHear,
    } = req.body;

    // Save to MongoDB
    const event = await EventRequest.create({
      eventName, eventType,
      eventDate, eventTime: "00:00", deliveryTime: deliveryTime || "00:00",
      eventLocation, guestCount: guestCount ? parseInt(guestCount) : null,
      contactPerson, contactNumber, contactEmail,
      secondaryContactPerson, secondaryContactNumber, secondaryContactRelation,
      products: (productsPayload || []).map(p => ({
        productId: p.productId || undefined,
        productName: p.productName,
        approximateQuantity: p.quantity || 1,
        unit: p.unit,
      })),
      specialInstructions, budgetRange, howDidYouHear,
    });

    // ── Respond immediately — don't wait for email/sheets ──
    res.status(201).json({
      success: true,
      message: "Event order request submitted successfully!",
      eventId: event._id,
    });

    // ── Fire-and-forget: email + sheets (non-blocking) ──
    sendMail({
      to: process.env.ADMIN_EMAIL || process.env.SMTP_EMAIL,
      subject: `🎉 New Event Order — ${eventName}`,
      html: buildAdminEmail({ event, itemsRequired }),
    }).catch(e => console.error("Admin email failed:", e.message));

    if (contactEmail) {
      sendMail({
        to: contactEmail,
        subject: `✅ Order Request Received — Ammu Foods`,
        html: buildCustomerEmail({ event, itemsRequired }),
      }).catch(e => console.error("Customer email failed:", e.message));
    }

    appendToSheet({
      submittedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      eventName, eventType: eventType || "",
      contactPerson, contactNumber, contactEmail: contactEmail || "",
      secondaryContactPerson: secondaryContactPerson || "",
      secondaryContactNumber: secondaryContactNumber || "",
      eventDate, deliveryTime: deliveryTime || "",
      guestCount: guestCount || "", eventLocation,
      itemsRequired: itemsRequired || "",
      budgetRange: budgetRange || "",
      specialInstructions: specialInstructions || "",
      howDidYouHear: howDidYouHear || "",
      status: "NEW",
    }).catch(e => console.error("Sheets failed:", e.message));
  } catch (error) {
    console.error("Error creating event request:", error);
    res.status(500).json({ success: false, message: "Failed to submit. Please try again.", error: error.message });
  }
};

// ── Admin email HTML ──
function buildAdminEmail({ event, itemsRequired }) {
  const eventDate = new Date(event.eventDate).toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Kolkata",
  });
  const submittedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);max-width:600px;width:100%;">
  <tr><td style="background:linear-gradient(135deg,#CC1417,#a01012);padding:32px 40px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-size:26px;font-weight:bold;">🎉 Ammu Foods</h1>
    <p style="margin:8px 0 0;color:#FAAE3E;font-size:13px;letter-spacing:2px;text-transform:uppercase;">New Event Order Request</p>
  </td></tr>
  <tr><td style="background:#FAAE3E;padding:10px 40px;text-align:center;">
    <p style="margin:0;color:#5D4037;font-weight:bold;font-size:13px;">⚡ Action Required — Review and contact the customer</p>
  </td></tr>
  <tr><td style="padding:32px 40px;">

    <h2 style="margin:0 0 16px;color:#5D4037;font-size:17px;border-bottom:2px solid #FAAE3E;padding-bottom:8px;">📋 Event Details</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${row("Event Name", event.eventName)}
      ${event.eventType ? row("Event Type", event.eventType) : ""}
      ${row("Event Date", eventDate)}
      ${row("Delivery Time", event.deliveryTime || "Not specified")}
      ${row("Venue", event.eventLocation)}
      ${event.guestCount ? row("Guest Count", `${event.guestCount} guests`) : ""}
      ${event.budgetRange ? row("Budget Range", event.budgetRange) : ""}
    </table>

    <h2 style="margin:24px 0 16px;color:#5D4037;font-size:17px;border-bottom:2px solid #FAAE3E;padding-bottom:8px;">👤 Primary Contact</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${row("Name", event.contactPerson)}
      ${row("Mobile", `<a href="tel:${event.contactNumber}" style="color:#CC1417;font-weight:bold;">${event.contactNumber}</a>`)}
      ${event.contactEmail ? row("Email", `<a href="mailto:${event.contactEmail}" style="color:#CC1417;">${event.contactEmail}</a>`) : ""}
    </table>

    ${event.secondaryContactPerson ? `
    <h2 style="margin:24px 0 16px;color:#5D4037;font-size:17px;border-bottom:2px solid #FAAE3E;padding-bottom:8px;">👥 Secondary Contact</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${row("Name", `${event.secondaryContactPerson}${event.secondaryContactRelation ? ` <span style="color:#888;font-weight:normal;">(${event.secondaryContactRelation})</span>` : ""}`)}
      ${event.secondaryContactNumber ? row("Mobile", `<a href="tel:${event.secondaryContactNumber}" style="color:#CC1417;font-weight:bold;">${event.secondaryContactNumber}</a>`) : ""}
    </table>` : ""}

    ${itemsRequired ? `
    <h2 style="margin:24px 0 16px;color:#5D4037;font-size:17px;border-bottom:2px solid #FAAE3E;padding-bottom:8px;">🛒 Items Requested</h2>
    <div style="background:#FFF5E1;border-left:4px solid #FAAE3E;border-radius:6px;padding:14px 18px;">
      <p style="margin:0;color:#5D4037;font-size:14px;line-height:1.9;">${itemsRequired.replace(/,\s*/g, "<br/>• ").replace(/^/, "• ")}</p>
    </div>` : ""}

    ${event.specialInstructions ? `
    <h2 style="margin:24px 0 16px;color:#5D4037;font-size:17px;border-bottom:2px solid #FAAE3E;padding-bottom:8px;">📝 Special Instructions</h2>
    <div style="background:#f9f9f9;border-radius:6px;padding:14px 18px;border:1px solid #eee;">
      <p style="margin:0;color:#555;font-size:14px;line-height:1.7;">${event.specialInstructions}</p>
    </div>` : ""}

    ${event.howDidYouHear ? `<p style="margin:20px 0 0;color:#aaa;font-size:12px;">Referral source: ${event.howDidYouHear}</p>` : ""}

    <div style="margin-top:28px;text-align:center;">
      <a href="tel:${event.contactNumber}" style="display:inline-block;background:#CC1417;color:#fff;text-decoration:none;padding:13px 32px;border-radius:50px;font-weight:bold;font-size:15px;">
        📞 Call ${event.contactPerson}
      </a>
    </div>

  </td></tr>
  <tr><td style="background:#5D4037;padding:18px 40px;text-align:center;">
    <p style="margin:0;color:#F5F5DC;font-size:12px;opacity:0.8;">Ammu Foods · Coimbatore · ammufoods2018@gmail.com</p>
    <p style="margin:5px 0 0;color:#FAAE3E;font-size:11px;">Submitted on ${submittedAt} IST</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

// ── Customer confirmation email ──
function buildCustomerEmail({ event, itemsRequired }) {
  const eventDate = new Date(event.eventDate).toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Kolkata",
  });

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);max-width:600px;width:100%;">
  <tr><td style="background:linear-gradient(135deg,#CC1417,#a01012);padding:32px 40px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-size:26px;font-weight:bold;">🎉 Ammu Foods</h1>
    <p style="margin:8px 0 0;color:#FAAE3E;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Order Request Confirmed</p>
  </td></tr>
  <tr><td style="background:#04A96D;padding:10px 40px;text-align:center;">
    <p style="margin:0;color:#fff;font-weight:bold;font-size:13px;">✅ We've received your order request!</p>
  </td></tr>
  <tr><td style="padding:32px 40px;">

    <p style="color:#333;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Dear <strong>${event.contactPerson}</strong>,<br/><br/>
      Thank you for choosing <strong>Ammu Foods</strong> for your event! We've received your order request and our team will review it and <strong>contact you within 24 hours</strong> to confirm the details.
    </p>

    <h2 style="margin:0 0 16px;color:#5D4037;font-size:17px;border-bottom:2px solid #FAAE3E;padding-bottom:8px;">📋 Your Order Summary</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${row("Event", event.eventName)}
      ${event.eventType ? row("Type", event.eventType) : ""}
      ${row("Date", eventDate)}
      ${row("Delivery Time", event.deliveryTime || "To be confirmed")}
      ${row("Venue", event.eventLocation)}
      ${event.guestCount ? row("Guests", `${event.guestCount} people`) : ""}
    </table>

    ${itemsRequired ? `
    <h2 style="margin:24px 0 16px;color:#5D4037;font-size:17px;border-bottom:2px solid #FAAE3E;padding-bottom:8px;">🛒 Items Requested</h2>
    <div style="background:#FFF5E1;border-left:4px solid #FAAE3E;border-radius:6px;padding:14px 18px;">
      <p style="margin:0;color:#5D4037;font-size:14px;line-height:1.9;">${itemsRequired.replace(/,\s*/g, "<br/>• ").replace(/^/, "• ")}</p>
    </div>` : ""}

    <div style="margin:28px 0;background:#FFF5E1;border-radius:10px;padding:20px 24px;border:1px solid #FAAE3E30;">
      <p style="margin:0 0 8px;color:#5D4037;font-weight:bold;font-size:14px;">📞 Need to reach us?</p>
      <p style="margin:0;color:#555;font-size:14px;">Call: <a href="tel:+919994936495" style="color:#CC1417;font-weight:bold;">99949 36495</a></p>
      <p style="margin:4px 0 0;color:#555;font-size:14px;">Email: <a href="mailto:ammufoods2018@gmail.com" style="color:#CC1417;">ammufoods2018@gmail.com</a></p>
    </div>

    <p style="color:#888;font-size:13px;line-height:1.6;margin:0;">
      We look forward to making your event special with our authentic homemade delicacies. 🙏
    </p>

  </td></tr>
  <tr><td style="background:#5D4037;padding:18px 40px;text-align:center;">
    <p style="margin:0;color:#F5F5DC;font-size:12px;opacity:0.8;">Ammu Foods · 7/602, Kumaran Nagar, Sulur, Coimbatore 641669</p>
    <p style="margin:5px 0 0;color:#FAAE3E;font-size:11px;">© ${new Date().getFullYear()} Ammu Foods. All rights reserved.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function row(label, value) {
  return `<tr>
    <td style="padding:9px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:13px;width:38%;vertical-align:top;">${label}</td>
    <td style="padding:9px 0;border-bottom:1px solid #f0f0f0;color:#333;font-size:14px;font-weight:600;vertical-align:top;">${value || "—"}</td>
  </tr>`;
}

// ── Admin: Get all events ──
const getAllEventRequests = async (req, res) => {
  try {
    const events = await EventRequest.find().sort({ createdAt: -1 });
    res.json({ success: true, events });
  } catch { res.status(500).json({ success: false, message: "Failed to fetch events" }); }
};

// ── Admin: Get single event ──
const getEventById = async (req, res) => {
  try {
    const event = await EventRequest.findById(req.params.id).lean();
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, event });
  } catch { res.status(500).json({ success: false, message: "Failed to fetch event" }); }
};

// ── Admin: Update event status ──
const updateEventStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const valid = ["NEW","CONTACTED","ACCEPTED","MANUFACTURING","PACKING","OUT_FOR_DELIVERY","COMPLETED","REJECTED"];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });

    const event = await EventRequest.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    event.status = status;
    event.statusHistory.push({ status, timestamp: new Date(), notes: adminNotes || `Status updated to ${status}` });
    if (adminNotes) {
      const entry = `[${new Date().toLocaleString()}] ${adminNotes}`;
      event.adminNotes = event.adminNotes ? `${event.adminNotes}\n${entry}` : entry;
    }
    await event.save();
    res.json({ success: true, message: "Status updated", event });
  } catch { res.status(500).json({ success: false, message: "Failed to update status" }); }
};

module.exports = { createEventRequest, getAllEventRequests, getEventById, updateEventStatus };
