const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send email via Resend API
 * On Resend free tier (no verified domain), emails can only be sent
 * to the account owner's email. We always CC the admin so nothing is lost.
 */
const sendMail = async ({ to, subject, html }) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set — skipping email");
      return false;
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_EMAIL;

    // On free tier without verified domain, Resend only allows sending
    // to the account's own verified email. We send to admin always,
    // and CC the customer if different.
    const recipients = [adminEmail];
    if (to && to !== adminEmail) {
      recipients.push(to);
    }

    const { data, error } = await resend.emails.send({
      from: "Ammu Foods <onboarding@resend.dev>",
      to: recipients,
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", JSON.stringify(error));
      return false;
    }

    console.log("✅ Email sent:", data?.id);
    return true;
  } catch (err) {
    console.error("Email sending failed:", err.message);
    return false;
  }
};

module.exports = { sendMail };
