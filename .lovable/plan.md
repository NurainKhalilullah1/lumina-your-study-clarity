
## Plan: Global Pomodoro Timer with Auto-Start and Dashboard Integration

### Overview

Transform the Pomodoro timer from a component-level state to a **global context** that persists across page navigation, auto-starts 10 seconds after login, and displays on the dashboard.

---

### Current State

- Pomodoro timer lives in `src/components/tutor/PomodoroTimer.tsx`
- Uses `usePomodoroTimer` hook which creates local state
- Only shown on the Tutor page
- Timer resets when navigating away

---

### Implementation

#### File 1: `src/contexts/PomodoroContext.tsx` (NEW)

Create a global context that manages timer state across the entire app:

```typescript
// Provides global timer state that persists across page navigation
// - Auto-starts 10 seconds after user logs in
// - Exposes timer controls (start, pause, reset, skip)
// - Tracks session completion for study stats
```

**Key Features:**
- Wraps the `usePomodoroTimer` logic but at the context level
- Uses `useEffect` with 10-second timeout after auth to auto-start
- Tracks `hasAutoStarted` to only trigger once per session
- Provides all timer state and controls via context

---

#### File 2: `src/App.tsx` (UPDATE)

Wrap the app with the new `PomodoroProvider`:

```tsx
<AuthProvider>
  <PomodoroProvider>  {/* NEW - wraps all protected routes */}
    <TooltipProvider>
      ...
    </TooltipProvider>
  </PomodoroProvider>
</AuthProvider>
```

---

#### File 3: `src/components/tutor/PomodoroTimer.tsx` (UPDATE)

Update to use the global context instead of local hook:

```tsx
// Before: const timer = usePomodoroTimer({}, callbacks);
// After:  const timer = usePomodoro(); // from context
```

All UI stays the same, just the state source changes.

---

#### File 4: `src/components/dashboard/DashboardPomodoroCard.tsx` (NEW)

Create a dashboard card that displays the Pomodoro timer with controls:

```text
┌─────────────────────────────────────────────┐
│  🍅 Focus Timer                             │
│  ─────────────────────────────────────────  │
│                                             │
│           [Progress Ring]                   │
│              24:35                          │
│              Focus                          │
│                                             │
│     [Reset] [Play/Pause] [Skip]             │
│                                             │
│     Session 2 • 1 completed                 │
└─────────────────────────────────────────────┘
```

Features:
- Large, visible timer display
- Mode indicator (Focus/Short Break/Long Break)
- Progress ring visualization
- Play/Pause, Reset, Skip controls
- Session counter

---

#### File 5: `src/pages/Dashboard.tsx` (UPDATE)

Add the Pomodoro card to the dashboard layout:

```tsx
// Add to imports
import { DashboardPomodoroCard } from "@/components/dashboard/DashboardPomodoroCard";

// Add to the grid layout (after greeting, before Weekly Goals)
<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
  <motion.div>
    <DashboardPomodoroCard />
  </motion.div>
  <motion.div className="lg:col-span-3">
    <WeeklyGoals />
  </motion.div>
</div>
```

---

### Auto-Start Logic (in PomodoroContext)

```typescript
// 10 seconds after login, auto-start the timer
useEffect(() => {
  if (user && !hasAutoStarted) {
    const timeout = setTimeout(() => {
      start();
      setHasAutoStarted(true);
      toast.info("Focus timer started! 🍅");
    }, 10000); // 10 seconds
    
    return () => clearTimeout(timeout);
  }
}, [user, hasAutoStarted]);

// Reset auto-start flag on logout
useEffect(() => {
  if (!user) {
    setHasAutoStarted(false);
  }
}, [user]);
```

---

### Files to be Modified/Created

| File | Action |
|------|--------|
| `src/contexts/PomodoroContext.tsx` | **CREATE** - Global timer context with auto-start |
| `src/App.tsx` | **UPDATE** - Wrap with PomodoroProvider |
| `src/components/tutor/PomodoroTimer.tsx` | **UPDATE** - Use context instead of local hook |
| `src/components/dashboard/DashboardPomodoroCard.tsx` | **CREATE** - Dashboard timer card |
| `src/pages/Dashboard.tsx` | **UPDATE** - Add Pomodoro card to layout |

---

### Technical Details

#### Context State Shape

```typescript
interface PomodoroContextType {
  // State
  timeRemaining: number;
  isRunning: boolean;
  mode: 'work' | 'shortBreak' | 'longBreak';
  completedSessions: number;
  formattedTime: string;
  progress: number;
  
  // Controls
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
}
```

#### Timer Persistence

The timer runs in the context at the app level, so:
- Navigating between Dashboard, Tutor, Settings, etc. keeps timer running
- Timer only resets on page refresh or logout
- Progress is visible on both Dashboard (card) and Tutor (header button)

---

### User Experience Flow

1. User logs in
2. After 10 seconds, timer auto-starts with toast notification
3. User sees timer counting on Dashboard card
4. User navigates to Tutor page - timer still visible in header, still counting
5. User goes back to Dashboard - card shows same progress
6. When session completes, notification + study event tracked
