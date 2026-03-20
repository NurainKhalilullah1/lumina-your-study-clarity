/**
 * routes/upgrade.js
 * Handles premium upgrade requests:
 *   1. Receives receipt image from user
 *   2. Uploads it to Cloudinary
 *   3. Saves the request in Neon for admin review
 */
import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import db from "../db.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /api/upgrade — submit a receipt for premium access
router.post("/", requireAuth(), upload.single("receipt"), async (req, res) => {
  const { userId } = getAuth(req);
  if (!req.file) return res.status(400).json({ error: "Receipt file is required" });

  try {
    // Upload receipt to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "studyflow/receipts", resource_type: "image" },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      stream.end(req.file.buffer);
    });

    // Get profile id from clerk_id
    const { rows: profileRows } = await db.query(
      "SELECT id FROM public.profiles WHERE clerk_id = $1",
      [userId]
    );
    if (!profileRows.length) return res.status(404).json({ error: "Profile not found" });

    // Save upgrade request
    const { rows } = await db.query(
      `INSERT INTO public.upgrade_requests (user_id, receipt_url, status)
       VALUES ($1, $2, 'pending') RETURNING *`,
      [profileRows[0].id, uploadResult.secure_url]
    );

    res.status(201).json({ message: "Upgrade request submitted!", request: rows[0] });
  } catch (err) {
    console.error("[Upgrade]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/upgrade/status — check current user's upgrade status
router.get("/status", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  try {
    const { rows } = await db.query(
      `SELECT ur.status, ur.created_at, ur.admin_notes
       FROM public.upgrade_requests ur
       JOIN public.profiles p ON p.id = ur.user_id
       WHERE p.clerk_id = $1
       ORDER BY ur.created_at DESC
       LIMIT 1`,
      [userId]
    );
    res.json(rows[0] || { status: "none" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
