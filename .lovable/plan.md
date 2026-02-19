

## Fix Leaderboard to Show All Learners

### Problem

The leaderboard currently has two blockers preventing it from showing all users:

1. The `leaderboard_view` starts from `user_xp` table (LEFT JOIN profiles), so users without a `user_xp` row don't appear at all
2. The `profiles` table RLS only allows users to read their own row (`auth.uid() = id`), so even with the view, one user can't see another user's name or avatar

### Solution

Replace the current `leaderboard_view` with a **security definer function** that safely returns leaderboard data for all registered users without exposing sensitive profile fields (like email).

### Database Changes

**Drop** the existing `leaderboard_view` and **create** a new `get_leaderboard()` function:

```text
Function: get_leaderboard()
Returns: TABLE(user_id uuid, name text, total_xp int, level int, avatar_url text)
Security: DEFINER (bypasses RLS safely)
```

Logic:
- Start from `profiles` (so ALL users appear)
- LEFT JOIN `user_xp` (users without XP get defaults)
- Return only safe fields: user_id, display name (never email), total_xp, level, avatar_url
- Order by total_xp descending, limit 50
- Users without any activity show as Level 1, 0 XP

### Code Changes

**`src/pages/Leaderboard.tsx`**
- Change the query from `supabase.from("leaderboard_view")` to `supabase.rpc("get_leaderboard")`
- Remove the `.order()` and `.limit()` calls (handled in the function)
- Everything else stays the same

### Technical Details

The security definer function runs with the function owner's permissions (bypassing RLS), which lets it read from both `profiles` and `user_xp` tables across all users. It only exposes safe columns (no email, no sensitive data). This is the recommended Supabase pattern for cross-user data access.

The function uses `COALESCE(ux.display_name, p.full_name, 'Anonymous')` for the name, so:
- If a user set a display name, that shows
- Otherwise their profile name shows
- If neither exists, they appear as "Anonymous"

