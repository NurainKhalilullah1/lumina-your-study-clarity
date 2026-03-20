/**
 * routes/admin.js
 * Admin-only routes for managing upgrade requests and users.
 * Protected: only users with role='admin' in Neon can access these.
 */
import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import db from "../db.js";

const router = Router();

// Middleware: check the user has admin role in Neon
async function requireAdmin(req, res, next) {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { rows } = await db.query(
    "SELECT role FROM public.profiles WHERE clerk_id = $1",
    [userId]
  );
  if (!rows.length || rows[0].role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  next();
}

// GET /api/admin/upgrade-requests — list all pending upgrade requests
router.get(
  "/upgrade-requests",
  requireAuth(),
  requireAdmin,
  async (req, res) => {
    try {
      const { rows } = await db.query(
        `SELECT ur.*, p.email, p.full_name
         FROM public.upgrade_requests ur
         JOIN public.profiles p ON p.id = ur.user_id
         ORDER BY ur.created_at DESC`
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// PATCH /api/admin/upgrade-requests/:id — approve or reject
router.patch(
  "/upgrade-requests/:id",
  requireAuth(),
  requireAdmin,
  async (req, res) => {
    const { id } = req.params;
    const { status, admin_notes } = req.body; // status: 'approved' | 'rejected'

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    try {
      // Update the request
      await db.query(
        `UPDATE public.upgrade_requests
         SET status = $2, admin_notes = $3, updated_at = now()
         WHERE id = $1`,
        [id, status, admin_notes]
      );

      // If approved, set user as premium
      if (status === "approved") {
        await db.query(
          `UPDATE public.profiles p
           SET is_premium = true, role = 'premium', updated_at = now()
           FROM public.upgrade_requests ur
           WHERE ur.id = $1 AND ur.user_id = p.id`,
          [id]
        );
      }

      res.json({ message: `Request ${status}` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /api/admin/users — list all users
router.get("/users", requireAuth(), requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT id, clerk_id, email, full_name, role, is_premium, created_at FROM public.profiles ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
