const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendApprovalEmail({
  full_name,
  phone,
  reason,
  approvalToken,
}) {
  const approveLink = `${process.env.BASE_URL}/api/approve?token=${approvalToken}`;
  const rejectLink = `${process.env.BASE_URL}/api/reject?token=${approvalToken}`;

  await resend.emails.send({
    from: "Zahava <onboarding@resend.dev>",
    to: process.env.ADMIN_EMAIL,
    subject: "בקשת הצטרפות חדשה – מערכת זהבה 💛",
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
