/**
 * routes/webhook.js
 * Handles Clerk webhook events to sync users → Neon `profiles` table.
 * Uses Svix to verify the webhook signature (security).
 */
import { Router } from "express";
import { Webhook } from "svix";
import db from "../db.js";
import { sendWelcomeEmail } from "../emails.js";

const router = Router();

// Clerk sends a raw body — we need it unparsed for signature verification
router.post(
  "/clerk",
  express_raw_body_middleware(),
  async (req, res) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    const wh = new Webhook(WEBHOOK_SECRET);
    let event;

    try {
      event = wh.verify(req.rawBody, {
        "svix-id": req.headers["svix-id"],
        "svix-timestamp": req.headers["svix-timestamp"],
        "svix-signature": req.headers["svix-signature"],
      });
    } catch (err) {
      console.error("[Webhook] Invalid signature:", err.message);
      return res.status(400).json({ error: "Invalid signature" });
    }

    const { type, data } = event;
    console.log(`[Webhook] Event: ${type}`);

    if (type === "user.created") {
      const { id, email_addresses, first_name, last_name, image_url } = data;
      const email = email_addresses?.[0]?.email_address;
      const fullName = [first_name, last_name].filter(Boolean).join(" ");

      try {
        await db.query(
          `INSERT INTO public.profiles (clerk_id, email, full_name, avatar_url)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (clerk_id) DO UPDATE
             SET email = EXCLUDED.email,
                 full_name = EXCLUDED.full_name,
                 avatar_url = EXCLUDED.avatar_url,
                 updated_at = now()`,
          [id, email, fullName, image_url]
        );
        console.log(`[Webhook] Profile synced: ${email}`);

        // Send welcome email via Resend
        if (email) {
          await sendWelcomeEmail({ email, name: fullName || "there" });
        }
      } catch (err) {
        console.error("[Webhook] DB error:", err.message);
      }
    }

    if (type === "user.updated") {
      const { id, email_addresses, first_name, last_name, image_url } = data;
      const email = email_addresses?.[0]?.email_address;
      const fullName = [first_name, last_name].filter(Boolean).join(" ");

      await db.query(
        `UPDATE public.profiles
         SET email = $2, full_name = $3, avatar_url = $4, updated_at = now()
         WHERE clerk_id = $1`,
        [id, email, fullName, image_url]
      );
    }

    if (type === "user.deleted") {
      await db.query("DELETE FROM public.profiles WHERE clerk_id = $1", [data.id]);
      console.log(`[Webhook] Profile deleted: ${data.id}`);
    }

    res.status(200).json({ received: true });
  }
);

// Helper: Express middleware that reads raw body for Svix
function express_raw_body_middleware() {
  return (req, res, next) => {
    let rawBody = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => { rawBody += chunk; });
    req.on("end", () => { req.rawBody = rawBody; next(); });
  };
}

export default router;
