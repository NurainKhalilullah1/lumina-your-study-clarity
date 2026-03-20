/**
 * emails.js — Resend email helper
 * Sends transactional emails from the StudyFlow backend.
 * Configure RESEND_API_KEY and RESEND_FROM_EMAIL in .env
 */
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || "StudyFlow <noreply@studyflow.onrender.com>";

/**
 * Sends a welcome email to a newly signed-up user.
 */
export async function sendWelcomeEmail({ email, name }) {
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Welcome to StudyFlow! 🎓",
      html: `
        <div style="font-family:Inter,sans-serif;max-width:560px;margin:auto;padding:32px;">
          <h1 style="color:#6366f1;font-size:28px;margin-bottom:8px;">Welcome, ${name}! 👋</h1>
          <p style="color:#334155;font-size:16px;line-height:1.6;">
            You've just joined <strong>StudyFlow</strong> — your personalised study clarity platform.
          </p>
          <p style="color:#334155;font-size:16px;line-height:1.6;">Here's what you can do right away:</p>
          <ul style="color:#334155;font-size:15px;line-height:2;">
            <li>📚 Create flashcard decks</li>
            <li>🤖 Chat with your AI tutor</li>
            <li>📝 Take quizzes and track your progress</li>
            <li>🏆 Join the leaderboard</li>
          </ul>
          <a href="${process.env.CLIENT_URL || "https://studyflow.vercel.app"}/dashboard"
             style="display:inline-block;margin-top:24px;padding:14px 28px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
            Go to Dashboard →
          </a>
          <p style="color:#94a3b8;font-size:13px;margin-top:32px;">
            StudyFlow · Made with ❤️ for students
          </p>
        </div>
      `,
    });
    console.log(`[Email] Welcome sent to ${email}`);
  } catch (err) {
    console.error(`[Email] Failed to send welcome to ${email}:`, err.message);
  }
}

/**
 * Sends an upgrade approval email.
 */
export async function sendUpgradeApprovedEmail({ email, name }) {
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "🎉 You're now a Premium member!",
      html: `
        <div style="font-family:Inter,sans-serif;max-width:560px;margin:auto;padding:32px;">
          <h1 style="color:#6366f1;font-size:28px;">You're Premium, ${name}! 🚀</h1>
          <p style="color:#334155;font-size:16px;line-height:1.6;">
            Your receipt has been verified and your account has been upgraded to <strong>StudyFlow Premium</strong>.
          </p>
          <p style="color:#334155;font-size:16px;">Enjoy full access to all features!</p>
          <a href="${process.env.CLIENT_URL || "https://studyflow.vercel.app"}/dashboard"
             style="display:inline-block;margin-top:24px;padding:14px 28px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
            Open StudyFlow →
          </a>
        </div>
      `,
    });
    console.log(`[Email] Upgrade approval sent to ${email}`);
  } catch (err) {
    console.error(`[Email] Failed to send upgrade email to ${email}:`, err.message);
  }
}
