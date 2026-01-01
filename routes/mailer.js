const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

async function sendApprovalEmail({
  full_name,
  phone,
  reason,
  approvalToken,
}) {
  const approveLink = `${process.env.BASE_URL}/api/approve?token=${approvalToken}`;
  const rejectLink = `${process.env.BASE_URL}/api/reject?token=${approvalToken}`;

  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: "בקשת הצטרפות חדשה  מערכת זהבה ",
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
}

module.exports = { sendApprovalEmail };
