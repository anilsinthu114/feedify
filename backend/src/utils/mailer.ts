// src/utils/mailer.ts
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
  SMTP_FROM_NAME = "Expert Feedback System",
  APP_URL = process.env.FRONTEND_URL || "http://localhost:3000",
} = process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
  console.warn(
    "[mailer] Missing SMTP config. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env"
  );
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT || 587),
  secure: Number(SMTP_PORT) === 465, // true for 465, false for others
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

transporter
  .verify()
  .then(() => console.log("[mailer] SMTP transporter verified"))
  .catch((err) => console.error("[mailer] SMTP verification failed:", err));

function buildFeedbackEmailHtml(toName: string, link: string, token?: string) {
  const brand = SMTP_FROM_NAME;
  const preheader =
    "Your feedback report is ready. View it securely using the button below.";
  const safeLink = link || APP_URL;

  return `
  <!-- Preheader -->
  <span style="display:none!important;opacity:0;visibility:hidden;mso-hide:all;height:0;width:0;overflow:hidden;">
    ${preheader}
  </span>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f6f8fb;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:24px 24px;color:#ffffff;">
              <div style="font-size:20px;font-weight:700;">${brand}</div>
              <div style="font-size:13px;opacity:.9;margin-top:6px;">Feedback Session Summary</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px 8px 24px;color:#0f172a;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
              <h2 style="margin:0 0 12px 0;font-size:20px;">Hello ${toName},</h2>
              <p style="margin:0 0 12px 0;font-size:14px;color:#334155;">
                Your feedback report has been generated successfully. Use the button below to view it securely.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 8px 0;">
                <tr>
                  <td align="center" bgcolor="#2563eb" style="border-radius:8px;">
                    <a href="${safeLink}" target="_blank" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;font-size:14px;">
                      View Feedback
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0 0;font-size:12px;color:#64748b;">
                If the button doesn’t work, copy and paste this URL into your browser:
              </p>
              <p style="margin:6px 0 0 0;font-size:12px;word-break:break-all;">
                <a href="${safeLink}" target="_blank" style="color:#2563eb;text-decoration:underline;">${safeLink}</a>
              </p>
              <p style="margin:16px 0 0 0;font-size:12px;color:#64748b;">
                This link will expire in 7 days.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 24px;border-top:1px solid #e5e7eb;background:#fafafa;color:#64748b;font-size:12px;">
              <div style="margin-bottom:6px;">You received this email because a feedback session was created for you.</div>
              <div style="font-size:11px;">© ${new Date().getFullYear()} ${brand}. All rights reserved.</div>
            </td>
          </tr>
        </table>
        <div style="color:#94a3b8;font-size:12px;margin-top:10px;">
          Trouble viewing? <a href="${safeLink}" target="_blank" style="color:#2563eb;text-decoration:underline;">Open in browser</a>
        </div>
      </td>
    </tr>
  </table>
  `;
}

function buildFeedbackEmailText(toName: string, link: string, token: string) {
  return `Hello ${toName},
Your feedback report has been generated successfully.
Valid Token for the feedback session  is ${token}.
Open the link below to view it securely (valid for 7 days):

${link}

— ${SMTP_FROM_NAME}`;
}

export async function sendFeedbackLinkEmail(to: string, name: string, link: string, token: string): Promise<boolean> {
  try {
    const from = EMAIL_FROM || `${SMTP_FROM_NAME} <${SMTP_USER}>`;

    const info = await transporter.sendMail({
      from,
      to,
      subject: "Your Feedback Session Summary",
      html: buildFeedbackEmailHtml(name, link, token),
      text: buildFeedbackEmailText(name, link, token),
      headers: {
        "X-Entity-Ref-ID": `feedback-${Date.now()}`,
      },
    });

    console.log("[mailer] Email sent:", info.messageId);
    return true;
  } catch (err) {
    console.error("❌ SMTP mail error:", err);
    return false;
  }
}
