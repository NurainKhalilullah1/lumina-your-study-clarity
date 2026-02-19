

## Plan: Add Gamification System with XP, Achievements, and Leaderboard

### Overview

Build a complete gamification layer on top of existing `study_events` and `quiz_sessions` data. All XP calculations are pure math -- no AI calls. Includes a public leaderboard so users can see how they rank against other StudyFlow users.

---

### Database Changes

**New table: `user_xp`**

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid | gen_random_uuid() | PK |
| user_id | uuid | auth.uid() | unique, not null |
| total_xp | integer | 0 | |
| level | integer | 1 | |
| achievements | jsonb | '[]' | Array of `{ id, unlockedAt }` |
| display_name | text | null | For leaderboard (optional, falls back to profile name) |
| last_calculated_at | timestamptz | now() | |
| created_at | timestamptz | now() | |
| updated_at | timestamptz | now() | |

**RLS policies:**
- Users can SELECT their own row (full access)
- Users can INSERT/UPDATE their own row
- **Leaderboard read**: All authenticated users can SELECT `display_name`, `total_xp`, `level`, and `user_id` from ALL rows (limited columns only -- achieved via a database view)

**New view: `leaderboard_view`** (for safe public ranking)
```sql
CREATE VIEW leaderboard_view AS
SELECT
  ux.user_id,
  COALESCE(ux.display_name, p.full_name, 'Anonymous') AS name,
  ux.total_xp,
  ux.level,
  p.avatar_url
FROM user_xp ux
LEFT JOIN profiles p ON p.id = ux.user_id
ORDER BY ux.total_xp DESC;
```

RLS on `user_xp`: All authenticated users can SELECT (leaderboard needs this). Only own row for INSERT/UPDATE.

---

### Generous XP Rewards

| Activity | XP Earned | Notes |
|----------|-----------|-------|
| Pomodoro session completed | **25 XP** | Core study reward |
| Flashcard reviewed | **5 XP** | Per card |
| Document analyzed | **20 XP** | Engaging with material |
| Quiz completed (any score) | **20 XP** | Rewards practice |
| Quiz score 70%+ | **+20 bonus** | Competence |
| Quiz score 90%+ | **+40 bonus** | Excellence (stacks with 70% bonus) |
| Quiz improvement (beat previous best) | **+30 bonus** | Growth in weak areas |
| Daily login/activity | **10 XP** | Just for showing up |

**Leveling System (generous curve):**
- Level 1: 0 XP
- Level 2: 75 XP
- Level 3: 175 XP
- Level 4: 325 XP
- Level 5: 550 XP
- Formula: `XP needed = 35 * level^1.4` (rounded)
- Titles: Freshman, Learner, Scholar, Expert, Master, Sage, Legend, Grandmaster

---

### Achievements

| Achievement | Condition | XP Bonus |
|-------------|-----------|----------|
| First Focus | 1 pomodoro completed | 15 |
| Focus Warrior | 25 pomodoros | 75 |
| Focus Legend | 100 pomodoros | 200 |
| Card Collector | 50 flashcards reviewed | 40 |
| Card Master | 500 flashcards reviewed | 150 |
| Quiz Ace | Score 90%+ on any quiz | 50 |
| Quiz Streak | Score 70%+ on 5 quizzes in a row | 75 |
| 100 Questions Mastered | 100 correct answers | 100 |
| 3-Day Streak | 3 consecutive days | 40 |
| 7-Day Streak | 7 consecutive days | 100 |
| 14-Day Streak | 14 consecutive days | 200 |
| 30-Day Streak | 30 consecutive days | 400 |
| Comeback Kid | Improve quiz score on a previously failed topic | 60 |
| Bookworm | Analyze 10 documents | 50 |
| Scholar | Reach Level 5 | 100 |

---

### Leaderboard

- New page at `/leaderboard` showing top users ranked by XP
- Shows rank, name/avatar, level, total XP
- Highlights the current user's position
- Top 3 users get gold/silver/bronze styling
- Accessible from sidebar navigation
- Users can optionally set a display name (defaults to profile name)

---

### New Files

| File | Purpose |
|------|---------|
| `src/lib/gamification.ts` | Pure functions: XP calc, level thresholds, achievement definitions |
| `src/hooks/useGamification.ts` | Core hook: computes XP from events + quiz data, syncs to user_xp |
| `src/components/dashboard/XPProgressCard.tsx` | Dashboard card: level, XP bar, title |
| `src/components/dashboard/AchievementsCard.tsx` | Dashboard card: achievement badges grid |
| `src/components/gamification/LevelUpToast.tsx` | Toast notification for level-ups |
| `src/components/gamification/AchievementUnlockedToast.tsx` | Toast for new achievements |
| `src/pages/Leaderboard.tsx` | Full leaderboard page with rankings |

### Modified Files

| File | Change |
|------|--------|
| `src/pages/Dashboard.tsx` | Add XPProgressCard and AchievementsCard |
| `src/components/DashboardSidebar.tsx` | Add "Leaderboard" menu item with Trophy icon |
| `src/components/BottomNav.tsx` | Add Leaderboard to mobile nav |
| `src/App.tsx` | Add `/leaderboard` route |

---

### Technical Details

**`src/lib/gamification.ts`** -- Pure functions, no side effects:
- `XP_VALUES` constant with all XP amounts
- `ACHIEVEMENTS` array with id, name, description, icon, condition function, bonus XP
- `LEVEL_THRESHOLDS` array and `getLevelFromXP(xp)` function
- `calculateXPFromEvents(studyEvents, quizSessions)` -- returns total XP breakdown
- `checkAchievements(studyEvents, quizSessions, streakDays)` -- returns earned achievement IDs

**`src/hooks/useGamification.ts`**:
- Fetches `study_events` (90 days) and `quiz_sessions` using existing hooks/queries
- Computes XP and achievements client-side using pure functions
- Reads stored `user_xp` row, compares, detects new level-ups/achievements
- Upserts `user_xp` on changes
- Shows toast notifications for new achievements and level-ups
- Returns `{ level, totalXP, xpProgress, achievements, newAchievements, isLoading }`

**`src/pages/Leaderboard.tsx`**:
- Queries `leaderboard_view` for top 50 users
- Also queries current user's rank
- Table layout with rank, avatar, name, level badge, XP
- Current user row highlighted
- Responsive design matching existing dashboard style

**Dashboard integration**:
- XPProgressCard goes in the top grid row (making it 5 columns on large screens, or reorganizing to 2 rows)
- AchievementsCard goes as a new section below study stats

