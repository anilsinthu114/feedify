// src/utils/mailer.ts
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendFeedbackLinkEmail(to: string, name: string, link: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to,
      subject: "Your Feedback Session Summary",
      html: `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h2>Hello ${name},</h2>
          <p>Your feedback report has been generated successfully.</p>
          <p>You can view it securely by clicking the link below:</p>
          <p>
            <a href="${link}" target="_blank" style="
              background: #2563eb;
              color: white;
              padding: 10px 15px;
              border-radius: 6px;
              text-decoration: none;">
              View Feedback
            </a>
          </p>
          <p>This link will expire in 7 days.</p>
          <p style="font-size: 0.9rem; color: #64748b;">— Expert Feedback System</p>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Resend mail error:", error);
      return false;
    }

    console.log("📧 Feedback email sent:", data?.id);
    return true;
  } catch (err) {
    console.error("❌ Unexpected Resend error:", err);
    return false;
  }
}
