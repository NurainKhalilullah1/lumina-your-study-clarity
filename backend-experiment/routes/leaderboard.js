/**
 * routes/leaderboard.js
 * Returns the global XP leaderboard (top 50) from the Neon view.
 */
import { Router } from "express";
import { requireAuth } from "@clerk/express";
import db from "../db.js";

const router = Router();

router.get("/", requireAuth(), async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM public.leaderboard");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
