const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // חובה לפורט 465
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // ודא שזו "סיסמת אפליקציה" (App Password)
  },
  // הגדרות קריטיות ל-Railway למניעת Timeout
  family: 4, // מכריח שימוש ב-IPv4 (פותר המון בעיות ב-Railway)
  connectionTimeout: 15000, // 15 שניות המתנה לחיבור
  greetingTimeout: 15000,
  socketTimeout: 15000,
});

async function sendApprovalEmail({
  full_name,
  phone,
  reason,
  approvalToken,
}) {
  const approveLink = `${process.env.BASE_URL}/api/approve?token=${approvalToken}`;
  const rejectLink = `${process.env.BASE_URL}/api/reject?token=${approvalToken}`;

  try {
    await transporter.sendMail({
      from: `"מערכת זהבה" <${process.env.MAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "בקשת הצטרפות חדשה - מערכת זהבה",
      text: `
התקבלה בקשת הצטרפות חדשה:

שם: ${full_name}
טלפון: ${phone}
סיבה: ${reason || "לא צוינה"}

לאישור:
${approveLink}

לדחייה:
${rejectLink}
      `,
    });
    console.log("✅ Email sent successfully");
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw error; // חשוב לזרוק את השגיאה כדי לראות אותה בלוגים של Railway
  }
}

module.exports = { sendApprovalEmail };
