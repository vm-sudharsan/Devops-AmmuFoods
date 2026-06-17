/**
 * Google Sheets Service
 * Appends event order data to a Google Sheet for easy admin tracking.
 *
 * SETUP REQUIRED (one-time):
 * 1. Go to https://console.cloud.google.com/
 * 2. Enable "Google Sheets API" for your project
 * 3. Create a Service Account → download JSON key
 * 4. Share your Google Sheet with the service account email (Editor access)
 * 5. Add GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY to your .env
 * 6. Set GOOGLE_SHEET_ID in your .env (the ID from the sheet URL)
 *
 * Sheet URL format: https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit
 */

const { google } = require("googleapis");

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "188-2L2mJJS1kUCe-Lr9Aa68hw6uMLaEqZQfjdJ8hPME";
const SHEET_RANGE = "Sheet1!A:R"; // Columns A through R

// Column headers (must match the order of values in appendToSheet)
const HEADERS = [
  "Submitted At",
  "Event Name",
  "Event Type",
  "Contact Person",
  "Contact Number",
  "Contact Email",
  "Secondary Contact",
  "Secondary Number",
  "Event Date",
  "Delivery Time",
  "Guest Count",
  "Venue / Location",
  "Items Required",
  "Budget Range",
  "Special Instructions",
  "How Did You Hear",
  "Status",
];

/**
 * Get authenticated Google Sheets client
 */
function getAuthClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !privateKey) {
    throw new Error(
      "Google Sheets credentials not configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in .env"
    );
  }

  // Render stores the key with literal \n — convert to real newlines
  // Also strip surrounding quotes if present
  privateKey = privateKey
    .replace(/^["']|["']$/g, "")   // remove surrounding quotes
    .replace(/\\n/g, "\n");         // convert \n to real newlines

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

/**
 * Ensure the header row exists in the sheet.
 * Only writes headers if row 1 is empty.
 */
async function ensureHeaders(sheets) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A1:R1",
    });

    const firstRow = res.data.values?.[0];
    if (!firstRow || firstRow.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: "Sheet1!A1:R1",
        valueInputOption: "RAW",
        requestBody: { values: [HEADERS] },
      });
    }
  } catch (err) {
    // Non-fatal — headers check failed, continue anyway
    console.warn("Could not verify sheet headers:", err.message);
  }
}

/**
 * Append a new event order row to the Google Sheet.
 * @param {Object} data - Event order data
 */
async function appendToSheet(data) {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });

  await ensureHeaders(sheets);

  const row = [
    data.submittedAt,
    data.eventName,
    data.eventType || "",
    data.contactPerson,
    data.contactNumber,
    data.contactEmail || "",
    data.secondaryContactPerson || "",
    data.secondaryContactNumber || "",
    data.eventDate
      ? new Date(data.eventDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })
      : "",
    data.deliveryTime,
    data.guestCount,
    data.eventLocation,
    data.itemsRequired,
    data.budgetRange || "",
    data.specialInstructions || "",
    data.howDidYouHear || "",
    data.status || "NEW",
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: SHEET_RANGE,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });

  console.log("✅ Event order appended to Google Sheet");
}

module.exports = { appendToSheet };
