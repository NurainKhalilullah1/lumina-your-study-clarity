
## Fix: AI Tutor Layout Height on Mobile

### Root Cause

The Tutor page sets its flex container height to `h-[calc(100vh-2rem)]`. This works on desktop because the DashboardLayout's desktop header is hidden in favour of the sidebar. But on mobile, DashboardLayout adds:

- A **mobile top header** of `h-14` (56px)
- A **BottomNav** of `h-16` (64px) with `pb-16` padding on `<main>`

So the actual available height for the Tutor on mobile is:
```text
100vh - 56px (mobile header) - 64px (bottom nav) - 32px (2rem offset in calc) = overflows by ~120px
```

This overflow forces the browser to expand the layout horizontally, stretching the `ChatInput` across the full width and disrupting the entire layout.

Additionally, the Tutor page renders its **own internal header** (the one with the hamburger menu, branding, and tool buttons). This means on mobile there are actually **two stacked headers** — the DashboardLayout mobile header AND the Tutor's own header. The Tutor's own header is self-contained and sufficient on mobile, so the DashboardLayout mobile header should not be shown on the Tutor page.

### The Fix

**Two-part solution:**

**Part 1 — Correct the height calculation in `src/pages/Tutor.tsx`**

Replace `h-[calc(100vh-2rem)]` with a height that properly accounts for the mobile header and bottom nav:
- On mobile: subtract `h-14` (top header) + `h-16` (bottom nav) = `h-[calc(100vh-7.5rem)]`
- On desktop (md+): keep the current `h-[calc(100vh-3.5rem)]` (just the desktop top bar)

Using responsive Tailwind classes:
```tsx
// Before
<div className="flex h-[calc(100vh-2rem)] bg-background overflow-hidden">

// After
<div className="flex h-[calc(100vh-7.5rem)] md:h-[calc(100vh-3.5rem)] bg-background overflow-hidden">
```

**Part 2 — Hide the DashboardLayout mobile header on the Tutor route**

The Tutor page has its own complete header (hamburger menu, branding, document pill, tools). The DashboardLayout's mobile header is redundant and wastes vertical space. The cleanest fix is to give `DashboardLayout` an optional `hideMobileHeader` prop so Tutor can suppress it:

```tsx
// DashboardLayout.tsx
interface DashboardLayoutProps {
  children: React.ReactNode;
  hideMobileHeader?: boolean;
}

// Conditionally render the mobile header:
{!hideMobileHeader && (
  <header className="flex items-center justify-between h-14 ...">
    ...
  </header>
)}
```

And in `Tutor.tsx`:
```tsx
<DashboardLayout hideMobileHeader>
  ...
</DashboardLayout>
```

With the DashboardLayout mobile header hidden on the Tutor page, the height calc becomes simpler — only the BottomNav needs to be subtracted on mobile:
```tsx
// Final height after hiding mobile header:
h-[calc(100vh-4rem)]   // mobile: just bottom nav (h-16)
md:h-[calc(100vh-3.5rem)]  // desktop: just the top bar
```

### Files to Change

1. **`src/components/DashboardLayout.tsx`** — Add `hideMobileHeader?: boolean` prop and conditionally render the mobile `<header>` element.
2. **`src/pages/Tutor.tsx`** — Pass `hideMobileHeader` to `DashboardLayout` and update the flex container height to `h-[calc(100vh-4rem)] md:h-[calc(100vh-3.5rem)]`.

### What Will Look Correct After This Fix

- The Tutor page on mobile will occupy exactly the right height: full viewport minus only the bottom navigation bar.
- No double header on mobile — only the Tutor's own internal header shows.
- The `ChatInput` will render at its natural width (constrained to the chat column), not stretched.
- The starter cards and chat area will have proper vertical room to scroll without overflowing.
