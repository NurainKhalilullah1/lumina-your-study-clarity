
## Fix: AI Tutor Mobile Layout + Dashboard Sync Issues

---

### Issue 1: AI Tutor Mobile Layout (Still Broken)

**Root Cause (Deeper Analysis)**

The `BottomNav` is `position: fixed; bottom: 0` — it floats **over** content and is completely outside the flex layout flow. This means giving any container `pb-16` creates visual padding-bottom space.

However, the current inner content column has both `overflow-hidden` on its parent AND `pb-16`. When a container is `overflow-hidden`, any `padding-bottom` is clipped — content gets cut off instead of being spaced above the nav bar.

The actual fix: the main flex container in `Tutor.tsx` must **not** be `overflow-hidden` at the outer level. Only the messages scroll area should be `overflow-y-auto`. The `pb-16 md:pb-0` must live on a container that is **not** overflow-clipped.

**Fix:**

In `src/pages/Tutor.tsx`, change the outer flex wrapper from `overflow-hidden` to just control overflow only on the messages region. The inner column with `pb-16 md:pb-0` already does this — but the outer parent must not clip it.

```
// Before
<div className="flex flex-1 bg-background overflow-hidden min-h-0">
  ...
  <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">

// After  
<div className="flex flex-1 bg-background min-h-0">
  ...
  <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
```

Also verify that `DashboardLayout` with `hideMobileHeader` sets `h-screen overflow-hidden` on the root, which already correctly constrains the overall height. No `overflow-hidden` is needed on the Tutor's inner row div — it just needs to be `flex flex-1 min-h-0`.

---

### Issue 2: Dashboard Components Not Syncing

**Root Cause Analysis**

Multiple interconnected syncing problems were found across the codebase:

**Problem A — Study event tracking doesn't cascade to goal progress or XP:**
`useTrackStudyEvent` (in `useStudyStats.ts`) only invalidates `['study-events']` after inserting a new event. It does NOT invalidate:
- `['goal-progress']` — so Weekly Goals doesn't update when a Pomodoro session completes or flashcards are reviewed
- `['gamification-events']` — so XP and Achievements don't recalculate

**Problem B — Gamification queries have 60-second stale time:**
In `useGamification.ts`, all queries (`gamification-events`, `gamification-quizzes`, `gamification-questions`) have `staleTime: 60_000`. This means XP and achievements won't reflect new events for up to 60 seconds even after cache invalidation.

**Problem C — Dashboard.tsx uses no React Query:**
The `fetchData()` function in `Dashboard.tsx` uses raw `supabase` calls inside a plain `useEffect`. When assignments are added via the Quick Actions button, `onAssignmentAdded={fetchData}` re-runs, but:
- No loading state while refetching
- Stats momentarily show 0 before the new fetch resolves

**Problem D — Quiz completion doesn't invalidate goal progress:**
When a quiz is completed in `useQuiz.ts`, `goal-progress` is not invalidated, so the Weekly Goals "Quizzes" counter doesn't update until the user refreshes.

**The Fixes:**

**Fix A — `useTrackStudyEvent` must invalidate all dependent queries:**

```typescript
// In src/hooks/useStudyStats.ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['study-events'] });
  queryClient.invalidateQueries({ queryKey: ['goal-progress'] });
  queryClient.invalidateQueries({ queryKey: ['gamification-events'] });
},
```

**Fix B — Reduce or remove staleTime on gamification queries:**
Reduce `staleTime` from `60_000` to `0` on `gamification-events`, `gamification-quizzes`, and `gamification-questions` so they always refetch when invalidated.

**Fix C — Invalidate quiz-related queries after quiz completion:**
In `src/hooks/useQuiz.ts`, find where quiz sessions are completed/submitted and add:
```typescript
queryClient.invalidateQueries({ queryKey: ['goal-progress'] });
queryClient.invalidateQueries({ queryKey: ['gamification-quizzes'] });
```

**Fix D — Weekly Goals invalidation after upserting:**
Already done in `useUpsertWeeklyGoals` (`onSuccess` invalidates `['weekly-goals']`), but `['goal-progress']` should also be invalidated since its internal fetch of goals needs to be refreshed.

---

### Files to Change

1. **`src/pages/Tutor.tsx`** — Remove `overflow-hidden` from the outer flex row container (keep it only on the messages scroll area).

2. **`src/hooks/useStudyStats.ts`** — In `useTrackStudyEvent`'s `onSuccess`, also invalidate `['goal-progress']` and `['gamification-events']`.

3. **`src/hooks/useGamification.ts`** — Reduce `staleTime` from `60_000` to `0` on the three gamification queries so they reflect changes immediately when invalidated.

4. **`src/hooks/useQuiz.ts`** — After quiz completion, invalidate `['goal-progress']` and `['gamification-quizzes']`.

5. **`src/hooks/useWeeklyGoals.ts`** — In `useUpsertWeeklyGoals`'s `onSuccess`, also invalidate `['goal-progress']` so the progress display updates immediately after saving new targets.
