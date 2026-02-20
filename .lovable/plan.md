
## Fix: Create Missing `user_preferences` Table & Resolve Settings Errors

### Root Cause

The `user_preferences` table was never created in the database. All 18 migration files have been audited — this table does not exist anywhere. When you click "Save" on the Pomodoro Duration or Default Quiz Questions, the hook calls `.upsert()` against a non-existent table, which returns a PostgREST error that triggers the failure toast.

The `useUserPreferences` hook already has `(supabase as any)` type-casting workarounds which are a clear sign it was written anticipating a table that was never actually migrated.

### Fix 1: Database Migration — Create `user_preferences` table

A new migration will create the missing table with the exact columns the hook expects:

```sql
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  default_quiz_questions INTEGER NOT NULL DEFAULT 10,
  pomodoro_duration INTEGER NOT NULL DEFAULT 25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own preferences
CREATE POLICY "Users can manage their own preferences"
  ON public.user_preferences
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at on changes
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

NOTIFY pgrst, 'reload schema';
```

### Fix 2: Clean up `useUserPreferences.ts`

Once the table exists in the database and TypeScript types are regenerated, remove the `as any` type-casting workarounds so the hook uses the typed Supabase client properly. This eliminates the runtime risk from bypassing type safety.

### Fix 3: Settings Page — Minor Cleanup

The Settings page `src/pages/Settings.tsx` has a minor issue in the profile section: the `hasNameChanged` check compares against `user?.user_metadata?.full_name || ""`, but when the name field is first populated from `user_metadata`, a user who hasn't changed anything would still see the "Save Changes" button as disabled correctly. However, if the user clears the field to empty string, the button incorrectly stays disabled. This will be corrected so a blank name (removing the name) also counts as a change.

### Files to Change

1. **Database migration** (new file) — creates `user_preferences` table with RLS
2. **`src/hooks/useUserPreferences.ts`** — remove `as any` workarounds, use proper typed queries
3. **`src/pages/Settings.tsx`** — fix the `hasNameChanged` edge case logic

### What Will Work After This Fix

- Changing Pomodoro Duration and clicking Save → shows "Preferences Saved" success toast
- Changing Default Quiz Questions and clicking Save → shows "Preferences Saved" success toast  
- Preferences persist across sessions (loaded from DB on next visit)
- Profile name save button correctly responds to all edits
