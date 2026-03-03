

## Fix Dashboard Layout and Build Error

### Problem 1: Dashboard Layout Overflow
The dashboard uses a 5-column grid (`lg:grid-cols-5`) for the top row, cramming 3 small cards + a 2-column-span StudyStatsDashboard. The StudyStatsDashboard itself uses a 6-column grid for stat cards. On typical laptop screens (~1024-1440px), this causes the stat cards to overflow and get cut off.

**Fix:** Restructure the layout so the top widgets (Pomodoro, Weekly Goals, XP) sit in a 3-column grid on their own row, and StudyStatsDashboard gets its own full-width row below. Inside StudyStatsDashboard, change the stat cards grid from 6 columns to a responsive 2/3-column layout.

### Changes

**`src/pages/Dashboard.tsx`** (lines 100-113):
- Change from single 5-column grid to two separate rows:
  - Row 1: `grid-cols-1 md:grid-cols-3` for Pomodoro, Weekly Goals, XP Progress
  - Row 2: Full-width StudyStatsDashboard

**`src/components/dashboard/StudyStatsDashboard.tsx`** (lines 48, 85):
- Loading skeleton grid: change `xl:grid-cols-6` to `lg:grid-cols-3`
- Stat cards grid: change `xl:grid-cols-6` to `lg:grid-cols-3`

### Problem 2: Build Error in Edge Function
`error.message` fails because `error` is typed as `unknown` in the catch block.

**`supabase/functions/process-leagues/index.ts`** (line 25):
- Change `error.message` to `(error as Error).message`

