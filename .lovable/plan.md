

## League System for the Leaderboard

### Overview

Introduce a weekly league system with 25 tiers. Each week, XP resets to zero and users compete within their league. At the end of the week, the top 5 users (with >100 XP) get promoted, ranks 6-15 stay, and everyone else gets relegated. The leaderboard only shows users in the same league as the current user.

### The 25 Leagues

1. Bronze I
2. Bronze II
3. Bronze III
4. Silver I
5. Silver II
6. Silver III
7. Gold I
8. Gold II
9. Gold III
10. Platinum I
11. Platinum II
12. Platinum III
13. Diamond I
14. Diamond II
15. Diamond III
16. Ruby I
17. Ruby II
18. Ruby III
19. Emerald I
20. Emerald II
21. Emerald III
22. Champion I
23. Champion II
24. Champion III
25. Legend

### Promotion/Relegation Rules

- **Promoted (top 5, >100 XP)**: Move up one league
- **Stay (ranks 6-15)**: Remain in current league
- **Relegated (rank 16+)**: Move down one league (minimum league 1)
- **Initial state**: All existing users start at league 2. New users also start at league 2.
- **League 25 (Legend)**: Top 5 stay; no further promotion.
- **League 1**: No further relegation possible.

### Database Changes

**1. Add columns to `user_xp` table:**

```text
current_league  INTEGER NOT NULL DEFAULT 2
weekly_xp       INTEGER NOT NULL DEFAULT 0
week_start      DATE    NOT NULL DEFAULT (date_trunc('week', now())::date)
```

- `current_league`: The user's current league tier (1-25)
- `weekly_xp`: XP earned this week only (used for league ranking)
- `week_start`: Tracks which week the weekly_xp belongs to

**2. Create `league_history` table** (tracks past week results):

```text
id              UUID PRIMARY KEY
user_id         UUID NOT NULL (references user_xp.user_id)
week_start      DATE NOT NULL
league          INTEGER NOT NULL
weekly_xp       INTEGER NOT NULL DEFAULT 0
rank_in_league  INTEGER
outcome         TEXT ('promoted', 'stayed', 'relegated')
created_at      TIMESTAMPTZ DEFAULT now()
UNIQUE(user_id, week_start)
```

RLS: Users can read their own history; insert via server function only.

**3. Update `get_leaderboard()` function:**

Replace current function to accept a league parameter and filter by it:

```text
Function: get_league_leaderboard(p_league INTEGER)
Returns: TABLE(user_id, name, weekly_xp, level, avatar_url, current_league)
Logic:
  - Filter user_xp WHERE current_league = p_league
  - If week_start != current week start, treat weekly_xp as 0 (stale week)
  - Order by weekly_xp DESC
  - LEFT JOIN profiles for names/avatars
```

**4. Create `process_league_week()` database function:**

A SECURITY DEFINER function that:
1. Calculates the current week start date
2. For each league (1-25), ranks users by weekly_xp
3. Applies promotion/relegation rules
4. Records results in `league_history`
5. Resets `weekly_xp` to 0 and updates `week_start` for all users
6. Called via a scheduled cron job (weekly, Monday 00:00 UTC)

**5. Set up `pg_cron` job:**

Schedule `process_league_week()` to run every Monday at midnight UTC via an edge function called by cron.

### Frontend Changes

**1. `src/lib/gamification.ts`**

Add league names array (25 entries) and a helper `getLeagueName(league: number)`.

**2. `src/hooks/useGamification.ts`**

- Extend `UserXPRow` interface to include `current_league`, `weekly_xp`, `week_start`
- Compute weekly XP from events that occurred since the current week start (Monday)
- Sync `weekly_xp` to the database alongside `total_xp`
- Auto-reset: if `week_start` in the DB doesn't match current week, reset `weekly_xp` to 0 client-side
- Return `currentLeague` and `weeklyXP` from the hook

**3. `src/pages/Leaderboard.tsx`**

- Show the current league name and tier badge at the top (e.g., "Gold II")
- Display "Weekly XP" instead of total XP in the ranking column
- Call `supabase.rpc("get_league_leaderboard", { p_league: currentLeague })` instead of `get_leaderboard`
- Add colored zone indicators: green highlight for ranks 1-5 (promotion zone), neutral for 6-15 (safe zone), red/orange for 16+ (relegation zone)
- Add a legend/key explaining promotion/relegation rules
- Show countdown to end of week

**4. `src/components/dashboard/XPProgressCard.tsx`**

- Show the current league badge alongside the level info
- Display weekly XP progress in addition to total XP

### Technical Details

**Weekly XP Calculation (Client-Side)**

The gamification hook will filter `study_events` to only count events from the current week (Monday 00:00 UTC onwards) when computing `weeklyXP`. The `total_xp` calculation remains unchanged (all-time). Both values are synced to `user_xp`.

**Week Reset Logic**

When a user opens the app and their `week_start` in the DB is from a previous week, the client sets `weekly_xp = 0` and updates `week_start` to the current week. The cron job handles the official promotion/relegation, but the client-side reset ensures the UI shows 0 immediately on Monday.

**Cron Job (Edge Function)**

An edge function `process-leagues` will be created that:
1. Calls the `process_league_week()` database function
2. Is triggered weekly by `pg_cron` via `pg_net`

**Initial Migration**

The migration will set `current_league = 2` for all existing users and `DEFAULT 2` for new users, matching the requirement that everyone starts in league 2.

