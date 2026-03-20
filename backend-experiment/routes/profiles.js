/**
 * routes/profiles.js
 * Get/update the current user's profile from Neon.
 * Protected by Clerk JWT — only the authenticated user can access their own data.
 */
import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import db from "../db.js";

const router = Router();

// GET /api/profiles/me — fetch the current user's full profile
router.get("/me", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  try {
    const { rows } = await db.query(
      "SELECT * FROM public.profiles WHERE clerk_id = $1",
      [userId]
    );
    if (!rows.length) return res.status(404).json({ error: "Profile not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/profiles/me — update university, course_of_study, name, etc.
router.patch("/me", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  const { full_name, avatar_url, university, course_of_study } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE public.profiles
       SET full_name       = COALESCE($2, full_name),
           avatar_url      = COALESCE($3, avatar_url),
           university      = COALESCE($4, university),
           course_of_study = COALESCE($5, course_of_study),
           updated_at      = now()
       WHERE clerk_id = $1
       RETURNING *`,
      [userId, full_name, avatar_url, university, course_of_study]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
