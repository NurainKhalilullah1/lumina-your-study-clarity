import "dotenv/config";
import express from "express";
import cors from "cors";
import pkg from "pg";
const { Pool } = pkg;
import { Webhook } from "svix";
import bodyParser from "body-parser";

const app = express();
const port = process.env.PORT || 3001;

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

// ── HELLO WORLD ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "StudyFlow API is live!", status: "healthy" });
});

// ── CLERK WEBHOOK ───────────────────────────────────────────────────────────
app.post("/api/webhooks/clerk", bodyParser.raw({ type: "application/json" }), async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) return res.status(500).json({ error: "Missing secret" });

  const svix_id = req.headers["svix-id"];
  const svix_timestamp = req.headers["svix-timestamp"];
  const svix_signature = req.headers["svix-signature"];

  if (!svix_id || !svix_timestamp || !svix_signature) return res.status(400).end();

  const payload = req.body;
  const body = payload.toString();
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    return res.status(400).end();
  }

  if (evt.type === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const email = email_addresses[0]?.email_address;
    const fullName = `${first_name || ""} ${last_name || ""}`.trim();
    await pool.query(
      "INSERT INTO profiles (id, email, full_name, avatar_url) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET email = $2, full_name = $3, avatar_url = $4",
      [id, email, fullName, image_url]
    );
  }
  res.json({ success: true });
});

// ── PROFILE ROUTES ──────────────────────────────────────────────────────────
app.get("/api/profile/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM profiles WHERE id = $1", [userId]);
    res.json(result.rows[0] || null);
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

app.post("/api/profile", async (req, res) => {
  const { id, email, full_name, university, course_of_study, avatar_url } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO profiles (id, email, full_name, university, course_of_study, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET 
       full_name = COALESCE(EXCLUDED.full_name, profiles.full_name), 
       university = COALESCE(EXCLUDED.university, profiles.university), 
       course_of_study = COALESCE(EXCLUDED.course_of_study, profiles.course_of_study),
       avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
       updated_at = now()
       RETURNING *`,
      [id, email || null, full_name, university, course_of_study, avatar_url]
    );
    res.json(result.rows[0]);
  } catch (err) { 
    console.error("Profile Upsert Error:", err);
    res.status(500).json({ error: "DB Error" }); 
  }
});

app.delete("/api/profile/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    await pool.query("DELETE FROM profiles WHERE id = $1", [userId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

// ── PREFERENCES ROUTES ──────────────────────────────────────────────────────
app.get("/api/preferences/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM profiles WHERE id = $1", [userId]);
    const profile = result.rows[0];
    res.json({
      default_quiz_questions: profile?.default_quiz_questions || 10,
      pomodoro_duration: profile?.pomodoro_duration || 25
    });
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

app.post("/api/preferences", async (req, res) => {
  const { user_id, default_quiz_questions, pomodoro_duration } = req.body;
  try {
    const result = await pool.query(
      "UPDATE profiles SET default_quiz_questions = $1, pomodoro_duration = $2 WHERE id = $3 RETURNING *",
      [default_quiz_questions, pomodoro_duration, user_id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

// ── GAMIFICATION ROUTES ─────────────────────────────────────────────────────
app.get("/api/gamification/xp/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM user_xp WHERE user_id = $1", [userId]);
    res.json(result.rows[0] || { total_xp: 0, level: 1, weekly_xp: 0 });
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

app.get("/api/gamification/events/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM xp_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50", [userId]);
    res.json(result.rows);
  } catch (err) { res.json([]); } // Fallback to empty if table missing
});

app.get("/api/gamification/quizzes/:userId", async (req, res) => {
  try { res.json([]); } catch (err) { res.json([]); }
});

app.get("/api/gamification/questions/:userId", async (req, res) => {
  try { res.json([]); } catch (err) { res.json([]); }
});

app.post("/api/gamification/sync-xp", async (req, res) => {
  const { user_id, xp_to_add } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO user_xp (user_id, total_xp, weekly_xp, week_start) VALUES ($1, $2, $2, date_trunc('week', now()))
       ON CONFLICT (user_id) DO UPDATE SET 
       total_xp = user_xp.total_xp + EXCLUDED.total_xp,
       weekly_xp = user_xp.weekly_xp + EXCLUDED.weekly_xp,
       level = floor(sqrt((user_xp.total_xp + EXCLUDED.total_xp) / 100)) + 1
       RETURNING *`,
      [user_id, xp_to_add]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM leaderboard_view");
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

// ── CHAT ROUTES ─────────────────────────────────────────────────────────────
app.get("/api/conversations/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC", [userId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

app.post("/api/conversations", async (req, res) => {
  const { userId, title } = req.body;
  try {
    const result = await pool.query("INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING *", [userId, title]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

app.delete("/api/conversations/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM conversations WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

app.get("/api/messages/:convId", async (req, res) => {
  const { convId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC", [convId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

app.post("/api/messages", async (req, res) => {
  const { conversationId, role, content } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3) RETURNING *",
      [conversationId, role, content]
    );
    await pool.query("UPDATE conversations SET updated_at = now() WHERE id = $1", [conversationId]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

// ── QUIZ ROUTES ─────────────────────────────────────────────────────────────
app.get("/api/quiz/sessions/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM quiz_sessions WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
    res.json(result.rows);
  } catch (err) { res.json([]); }
});

// ── FLASHCARD ROUTES ────────────────────────────────────────────────────────
app.get("/api/flashcards/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      "SELECT f.* FROM flashcards f JOIN flashcard_decks d ON f.deck_id = d.id WHERE d.user_id = $1",
      [userId]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

// ── FILE ROUTES ─────────────────────────────────────────────────────────────
app.get("/api/files/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM user_files WHERE user_id = $1", [userId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

app.post("/api/files", async (req, res) => {
  const { user_id, file_name, file_path, file_size, mime_type, text_content, extraction_status } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO user_files (user_id, file_name, file_path, file_size, mime_type, text_content, extraction_status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [user_id, file_name, file_path, file_size, mime_type, text_content, extraction_status]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

app.delete("/api/files/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM user_files WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

// ── ACADEMIC ROUTES ─────────────────────────────────────────────────────────
app.get("/api/courses/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM courses WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

app.post("/api/courses", async (req, res) => {
  const { user_id, title, code, color } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO courses (user_id, title, code, color) VALUES ($1, $2, $3, $4) RETURNING *",
      [user_id, title, code, color]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

app.delete("/api/courses/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM courses WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

app.get("/api/assignments/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM assignments WHERE user_id = $1 ORDER BY due_date ASC", [userId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

app.post("/api/assignments", async (req, res) => {
  const { user_id, title, course_name, due_date, priority, status, type } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO assignments (user_id, title, course_name, due_date, priority, status, type) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [user_id, title, course_name, due_date, priority || 'medium', status || 'pending', type || 'assignment']
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

app.post("/api/assignments/bulk", async (req, res) => {
  const { user_id, tasks } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const task of tasks) {
      await client.query(
        "INSERT INTO assignments (user_id, title, course_name, due_date, priority, status, type) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [user_id, task.title, task.course || "General", task.date, task.type === 'exam' ? 'high' : 'medium', 'pending', task.type]
      );
    }
    await client.query("COMMIT");
    res.json({ success: true, count: tasks.length });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "DB Error" });
  } finally { client.release(); }
});

app.patch("/api/assignments/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query("UPDATE assignments SET status = $1 WHERE id = $2 RETURNING *", [status, id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

// ── COMMUNITY ROUTES ─────────────────────────────────────────────────────────
app.get("/api/community/posts", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM community_posts ORDER BY created_at DESC LIMIT 100");
    res.json(result.rows);
  } catch (err) { res.json([]); }
});

// ── DASHBOARD STATS ROUTE ───────────────────────────────────────────────────
app.get("/api/dashboard/stats/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const pendingQuery = pool.query("SELECT count(*) FROM assignments WHERE user_id = $1 AND status = 'pending'", [userId]);
    const examQuery = pool.query("SELECT count(*) FROM assignments WHERE user_id = $1 AND status = 'pending' AND priority = 'high'", [userId]);
    const completedQuery = pool.query("SELECT count(*) FROM assignments WHERE user_id = $1 AND status = 'completed'", [userId]);
    const urgentQuery = pool.query("SELECT * FROM assignments WHERE user_id = $1 AND status = 'pending' AND due_date <= now() + interval '3 days' ORDER BY due_date ASC LIMIT 3", [userId]);
    const [pending, exams, completed, urgent] = await Promise.all([pendingQuery, examQuery, completedQuery, urgentQuery]);
    res.json({
      pending: parseInt(pending.rows[0].count),
      exams: parseInt(exams.rows[0].count),
      completed: parseInt(completed.rows[0].count),
      urgent: urgent.rows
    });
  } catch (err) { 
    console.error("Dashboard DB Error:", err);
    res.json({ pending: 0, exams: 0, completed: 0, urgent: [] }); 
  }
});

// ── SUBSCRIPTION / UPGRADE ROUTES ──────────────────────────────────────────
app.get("/api/admin/upgrade-requests", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM upgrade_requests ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

app.get("/api/upgrade-requests/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM upgrade_requests WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
    res.json(result.rows);
  } catch (err) { 
    console.error("Upgrade Requests DB Error:", err);
    res.status(500).json({ error: "DB Error", details: err.message }); 
  }
});

app.post("/api/admin/upgrade-requests", async (req, res) => {
  const { user_id, requested_tier, amount, payment_reference, receipt_url } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO upgrade_requests (user_id, requested_tier, amount, payment_reference, receipt_url) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [user_id, requested_tier, amount, payment_reference, receipt_url]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

app.patch("/api/admin/upgrade-requests/:id", async (req, res) => {
  const { id } = req.params;
  const { status, reviewed_by, admin_note } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const reqResult = await client.query(
      "UPDATE upgrade_requests SET status = $1, reviewed_at = now(), reviewed_by = $2, admin_note = $3 WHERE id = $4 RETURNING *",
      [status, reviewed_by, admin_note, id]
    );
    const request = reqResult.rows[0];
    if (status === "approved" && request) {
      const storageLimit = request.requested_tier === "premium" ? 300 * 1024 * 1024 : 200 * 1024 * 1024;
      await client.query(
        "UPDATE profiles SET is_premium = true, subscription_tier = $1, storage_limit_bytes = $2 WHERE id = $3",
        [request.requested_tier, storageLimit, request.user_id]
      );
    }
    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "DB Error" });
  } finally { client.release(); }
});

// ── SYSTEM ROUTES ───────────────────────────────────────────────────────────
app.get("/api/app-versions/latest", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM app_versions WHERE is_active = true ORDER BY version_code DESC LIMIT 1");
    res.json(result.rows[0] || null);
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
