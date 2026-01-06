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

    html: `
<div style="font-family: Arial, sans-serif; direction: rtl; background:#f3f4f6; padding:32px;">
  <div style="max-width:520px; margin:auto; background:#ffffff; border-radius:16px; padding:28px; box-shadow:0 12px 30px rgba(0,0,0,0.08);">

    <!-- Header -->
    <h2 style="margin:0 0 8px; text-align:center;">
      🌱 בקשת הצטרפות חדשה
    </h2>
    <p style="text-align:center; color:#6b7280; margin-top:0;">
      התקבלה בקשה חדשה דרך מערכת זהבה
    </p>

    <!-- Info Card -->
    <div style="background:#f9fafb; border-radius:12px; padding:16px 18px; margin:24px 0;">
      <p style="margin:8px 0;"><strong>👤 שם:</strong> ${full_name}</p>
      <p style="margin:8px 0;"><strong>📞 טלפון:</strong> ${phone}</p>
      <p style="margin:8px 0;"><strong>💬 סיבה:</strong> ${reason || "לא צוינה"}</p>
    </div>

    <!-- CTA -->
    <p style="text-align:center; margin-bottom:16px;">
      בחר/י כיצד לפעול:
    </p>

    <div style="text-align:center;">
      <a href="${approveLink}"
         style="display:inline-block; width:180px; padding:14px 0; margin:6px;
                background:#22c55e; color:#ffffff; text-decoration:none;
                border-radius:999px; font-weight:bold;">
        ✅ אישור הצטרפות
      </a>

      <a href="${rejectLink}"
         style="display:inline-block; width:180px; padding:14px 0; margin:6px;
                background:#ef4444; color:#ffffff; text-decoration:none;
                border-radius:999px; font-weight:bold;">
        ❌ דחיית הבקשה
      </a>
    </div>

    <!-- Note -->
    <p style="margin-top:24px; font-size:13px; color:#6b7280; text-align:center;">
      הלחיצה תעדכן את המערכת באופן אוטומטי.<br/>
      אין צורך בהתחברות.
    </p>

    <!-- Footer -->
    <hr style="margin:28px 0; border:none; border-top:1px solid #e5e7eb;" />

    <p style="font-size:13px; color:#9ca3af; text-align:center; margin:0;">
      מערכת זהבה – תמיכה, חוסן ומיינדפולנס 💛<br/>
      Compassion & Wisdom
    </p>

  </div>
</div>
    `,
  });
}

module.exports = { sendApprovalEmail };
