

## Community Tab Improvements

Here are the improvements I recommend, covering usability, engagement, and visual polish:

### 1. Category Filter Chips
Add horizontal scrollable filter chips (All, Question, Tip, Discussion, Achievement) above the post feed so users can quickly filter by category without scrolling through irrelevant posts.

**Changes:** `src/pages/Community.tsx` -- Add a `useState` for active category filter, render a row of `Badge`-style buttons, filter posts client-side before rendering.

### 2. Sort Options (Newest / Most Upvoted)
Add a dropdown or toggle to sort posts by "Newest" (default) or "Most Upvoted" so high-quality content surfaces.

**Changes:** `src/pages/Community.tsx` -- Add sort state, sort the posts array before mapping. No backend changes needed since we already fetch `upvote_count`.

### 3. Search Bar
Add a search input above posts to filter by keyword in post content.

**Changes:** `src/pages/Community.tsx` -- Add a search `Input` with a `Search` icon, filter posts client-side using `.includes()` on content.

### 4. Richer Post Cards
- Larger author avatar (10x10 instead of 9x9)
- Post title support (optional bold first line)
- Better visual hierarchy with subtle hover effect
- Show relative time more prominently

**Changes:** `src/components/community/PostCard.tsx` -- Update sizing, add `hover:bg-accent/50 transition-colors`, improve typography.

### 5. Illustrated Empty States
Replace plain text empty states with an icon + heading + subtitle layout for both "No posts yet" and "Set your university" states.

**Changes:** `src/pages/Community.tsx` -- Add `MessageCircle` icon and styled empty state containers.

### 6. Trending Sidebar Section
Add a "Trending Posts" section in the sidebar (desktop) showing the top 3 most-upvoted posts of the week as compact links.

**Changes:** `src/components/community/GroupInfo.tsx` -- Add a trending section below the group info card, pulling from existing `allPosts` data sorted by upvote_count.

### Files to Modify
- `src/pages/Community.tsx` -- Filter chips, search bar, sort dropdown, empty states
- `src/components/community/PostCard.tsx` -- Visual polish, hover effects
- `src/components/community/GroupInfo.tsx` -- Add trending posts sidebar section

