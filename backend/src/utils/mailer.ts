// src/utils/mailer.ts
import dotenv from "dotenv";
import fs from "fs";
import nodemailer from "nodemailer";
import path from "path";

dotenv.config();

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM_NAME = "Feedify",
  EMAIL_FROM = "no-reply@feedify.vercel.app", // masked from-address
  FRONTEND_URL = "https://feedify.vercel.app",
} = process.env;

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  console.warn("[mailer] ⚠️ Missing SMTP credentials in .env");
}

// ✅ Create secure transporter (hidden sender identity)
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  tls: { rejectUnauthorized: false },
});

// ✅ Optional: small logo/avatar embedded as base64
const logoPath = path.resolve("public", "feedify-avatar.png");
let base64Logo = "";
if (fs.existsSync(logoPath)) {
  base64Logo = fs.readFileSync(logoPath).toString("base64");
  console.log("[mailer] 🖼️ Loaded avatar logo for email header.");
}

// ✅ Common masked sender
const SENDER = {
  name: SMTP_FROM_NAME,
  address: EMAIL_FROM,
};

// =========================================================
// 📨 FEEDBACK LINK EMAIL
// =========================================================
export async function sendFeedbackLinkEmail(to: string, name: string, link: string, token: string) {
  try {
    const preheader = "Your feedback report is ready for viewing (valid for 7 days).";
    const safeLink = link || `${FRONTEND_URL}/feedback/view/${token}`;

    const html = `
    <div style="background:#f4f6fb;padding:20px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <table role="presentation" width="100%" style="max-width:600px;margin:auto;background:white;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr>
          <td style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:16px;color:white;text-align:center;">
            ${base64Logo ? `<img src="data:image/png;base64,${base64Logo}" width="50" height="50" style="border-radius:50%;margin-bottom:10px;" />` : ""}
            <div style="font-size:20px;font-weight:700;">${SMTP_FROM_NAME}</div>
            <div style="font-size:13px;opacity:.85;">Feedback Session Summary</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;color:#0f172a;">
            <h3>Hello ${name},</h3>
            <p>Your feedback report has been generated successfully. Use the button below to view it securely.</p>

            <p style="background:#f1f5f9;padding:12px;border-radius:8px;">
              <strong>Feedback Token:</strong> ${token}<br/>
              <small style="color:#64748b;">(Valid for 7 days)</small>
            </p>

            <div style="text-align:center;margin:24px 0;">
              <a href="${safeLink}" target="_blank"
                style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
                View Feedback
              </a>
            </div>

            <p style="font-size:12px;color:#64748b;">If the button doesn’t work, copy and paste this link:</p>
            <a href="${safeLink}" style="font-size:12px;color:#2563eb;word-break:break-all;">${safeLink}</a>
          </td>
        </tr>
        <tr>
          <td style="background:#fafafa;padding:14px;text-align:center;font-size:12px;color:#94a3b8;">
            Please do not reply to this email. This mailbox is not monitored.<br/>
            &copy; ${new Date().getFullYear()} ${SMTP_FROM_NAME}. All rights reserved.
          </td>
        </tr>
      </table>
    </div>`;

    const info = await transporter.sendMail({
      from: SENDER,
      to,
      replyTo: "no-reply@feedify.vercel.app",
      subject: "Your Feedback Session Summary",
      html,
      text: `Hello ${name},\nYour feedback is ready.\nToken: ${token}\nOpen: ${safeLink}\n\n— ${SMTP_FROM_NAME}`,
      headers: {
        "X-Entity-Ref-ID": `feedback-${Date.now()}`,
        "Reply-To": "no-reply@feedify.vercel.app", // disables direct reply
      },
    });

    console.log("[mailer] ✅ Feedback email sent:", info.messageId);
    return true;
  } catch (err) {
    console.error("❌ SMTP feedback mail error:", err);
    return false;
  }
}

// =========================================================
// 🧾 SEND USER CREDENTIALS
// =========================================================
export async function sendUserCredentialsEmail(to: string, name: string, password: string) {
  try {
    const info = await transporter.sendMail({
      from: SENDER,
      to,
      replyTo: "no-reply@feedify.vercel.app",
      subject: "Your Feedify Account Credentials",
      html: `
        <div style="font-family:Segoe UI,Roboto,Arial;padding:20px;">
          <h3>Welcome ${name},</h3>
          <p>Your user account has been created. Please use the credentials below:</p>
          <ul>
            <li><b>Email:</b> ${to}</li>
            <li><b>Password:</b> ${password}</li>
          </ul>
          <p>We recommend changing your password after logging in.</p>
          <p style="color:#94a3b8;font-size:12px;">This is an automated no-reply message.</p>
        </div>`,
      headers: { "Reply-To": "no-reply@feedify.vercel.app" },
    });

    console.log("[mailer] ✅ Credentials email sent:", info.messageId);
    return true;
  } catch (err) {
    console.error("❌ SMTP credentials mail error:", err);
    return false;
  }
}

// =========================================================
// 🔐 PASSWORD RESET
// =========================================================
export async function sendPasswordResetEmail(to: string, name: string, resetLink: string) {
  try {
    const info = await transporter.sendMail({
      from: SENDER,
      to,
      replyTo: "no-reply@feedify.vercel.app",
      subject: "Reset Your Feedify Password",
      html: `
        <div style="font-family:Segoe UI,Roboto,Arial;padding:20px;">
          <h3>Hello ${name},</h3>
          <p>We received a request to reset your password.</p>
          <a href="${resetLink}" target="_blank"
             style="display:inline-block;background:#2563eb;color:white;padding:10px 18px;
                    text-decoration:none;border-radius:6px;margin:10px 0;">
             Reset Password
          </a>
          <p>If you did not request this, please ignore this email.</p>
          <p style="color:#94a3b8;font-size:12px;">This mailbox is not monitored — please do not reply.</p>
        </div>`,
      headers: { "Reply-To": "no-reply@feedify.vercel.app" },
    });

    console.log("[mailer] ✅ Password reset email sent:", info.messageId);
    return true;
  } catch (err) {
    console.error("❌ SMTP password reset mail error:", err);
    return false;
  }
}
