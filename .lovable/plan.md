

## Community Feature with University and Course Onboarding

### Overview

This plan adds a full community system to StudyFlow where students are automatically grouped by their university and course of study. New users select these during onboarding; existing users set them in Settings. The community feed shows posts from everyone, but each user also belongs to an automatic group for their university + course combination.

---

### Part 1: Database Changes

**A. Add `university` and `course_of_study` columns to `profiles` table**

```sql
ALTER TABLE profiles
  ADD COLUMN university text,
  ADD COLUMN course_of_study text;
```

These two fields determine automatic group membership. When a user saves both, they are auto-added to the matching group (created if it does not exist).

**B. Create 5 new tables**

| Table | Purpose |
|---|---|
| `community_posts` | All posts in the feed (questions, tips, discussions, achievements) |
| `community_comments` | Flat comment threads on posts |
| `community_upvotes` | One upvote per user per post |
| `study_groups` | Auto-created groups based on university + course_of_study |
| `study_group_members` | Tracks which users belong to which groups |

**`community_posts`**
- id (uuid, PK)
- user_id (uuid, FK to profiles, NOT NULL)
- content (text, NOT NULL)
- category (text: 'question', 'tip', 'discussion', 'achievement')
- group_id (uuid, FK to study_groups, nullable -- for group-specific posts)
- upvote_count (integer, default 0)
- comment_count (integer, default 0)
- created_at (timestamptz)

**`community_comments`**
- id (uuid, PK)
- post_id (uuid, FK to community_posts)
- user_id (uuid, FK to profiles)
- content (text)
- created_at (timestamptz)

**`community_upvotes`**
- id (uuid, PK)
- post_id (uuid, FK to community_posts)
- user_id (uuid, FK to profiles)
- UNIQUE(post_id, user_id)

**`study_groups`**
- id (uuid, PK)
- university (text, NOT NULL)
- course_of_study (text, NOT NULL)
- member_count (integer, default 0)
- created_at (timestamptz)
- UNIQUE(university, course_of_study)

**`study_group_members`**
- id (uuid, PK)
- group_id (uuid, FK to study_groups)
- user_id (uuid, FK to profiles)
- joined_at (timestamptz)
- UNIQUE(group_id, user_id)

**C. RLS Policies**

- All authenticated users can **read** all posts, comments, groups, and members (community is public within the app)
- Users can only **insert/update/delete** their own posts and comments
- Users can only **insert/delete** their own upvotes
- Group membership is managed automatically (insert/delete own only)
- `study_groups` are created by a database function, not directly by users

**D. Database function: `upsert_user_group`**

A `SECURITY DEFINER` function that:
1. Takes `p_university` and `p_course_of_study` as parameters
2. Creates the study_group if it does not exist (using `ON CONFLICT DO NOTHING`)
3. Removes the user from any previous group
4. Inserts the user into the matching group
5. Updates `member_count` on both the old and new groups

This function is called whenever a user saves their university + course in onboarding or settings.

**E. Update `profiles` RLS**

The existing SELECT policy only allows users to view their own profile. For the community to work (showing post author names and avatars), we need an additional SELECT policy:

```sql
CREATE POLICY "Authenticated users can view all profiles"
ON profiles FOR SELECT
USING (auth.uid() IS NOT NULL);
```

This replaces (or supplements) the existing self-only SELECT policies so that community post cards can display author info.

---

### Part 2: Onboarding Flow Update

**File: `src/pages/Onboarding.tsx`**

Currently the onboarding page just has a single "Complete Signup" button. It will be expanded to a multi-step form:

- **Step 1**: Welcome message (existing)
- **Step 2**: Select University (searchable dropdown with a predefined list of Nigerian universities, plus an "Other" option with a text input)
- **Step 3**: Enter Course of Study (text input, e.g. "Computer Science", "Mechanical Engineering")
- **Step 4**: Confirm and create profile

When the user clicks "Complete Signup":
1. `createProfile()` is called with the university and course_of_study
2. The `upsert_user_group` RPC is called to auto-add them to their group

The Profile interface in `useProfile.ts` will be updated to include `university` and `course_of_study` fields.

---

### Part 3: Settings Page Update

**File: `src/pages/Settings.tsx`**

A new "University & Course" section is added between Profile and Study Preferences:

- University dropdown (same list as onboarding)
- Course of Study text input
- Save button

When saved:
1. Updates `profiles` table with new university and course_of_study
2. Calls `upsert_user_group` RPC to move the user to the correct group
3. Shows a success toast

If the user already has a university and course set, the fields are pre-filled. Changing them moves them to a different group automatically.

---

### Part 4: Community Pages and Components

**New route: `/community`**

Sub-routes:
- `/community` -- Main feed (all posts from all users)
- `/community/my-group` -- Posts from the user's own university + course group

**New files:**

| File | Purpose |
|---|---|
| `src/pages/Community.tsx` | Main community page with tabs: "All Posts" and "My Group" |
| `src/components/community/PostCard.tsx` | Displays a single post with author avatar/name, content, category badge, upvote button, comment count |
| `src/components/community/CreatePostDialog.tsx` | Dialog to write a new post (content textarea, category selector, optional "post to my group" toggle) |
| `src/components/community/CommentSection.tsx` | Expandable list of comments under a post, with input to add a new comment |
| `src/components/community/GroupInfo.tsx` | Card showing the user's current group (university + course), member count |
| `src/hooks/useCommunity.ts` | React Query hooks for fetching posts, comments, upvotes; mutations for creating posts, commenting, toggling upvotes |

**Feed behavior:**
- "All Posts" tab: shows all `community_posts` ordered by `created_at DESC`, paginated
- "My Group" tab: filters posts where `group_id` matches the user's group
- Each post card shows the author's name, avatar, university badge, category label, content, upvote count, and comment count
- Clicking a post expands the comment section inline
- Floating action button to create a new post

**Upvote logic:**
- Toggle: if the user has already upvoted, clicking again removes the upvote
- `upvote_count` on `community_posts` is updated via a trigger or optimistic UI + server sync

---

### Part 5: Navigation Updates

**`src/components/DashboardSidebar.tsx`**
- Add "Community" item with `Users` icon between "Quiz History" and "Leaderboard"

**`src/components/BottomNav.tsx`**
- Replace "Settings" with "Community" (`Users` icon) since Settings is accessible from the sidebar on desktop and can be reached via the sidebar hamburger menu on mobile

**`src/App.tsx`**
- Add route: `/community` wrapped in `ProtectedRoute`

---

### Part 6: Implementation Order

1. **Migration**: Add columns to `profiles`, create 5 new tables, RLS policies, `upsert_user_group` function, update profiles SELECT policy
2. **Profile hook**: Update `useProfile.ts` interface and `createProfile` to include university + course_of_study
3. **Onboarding**: Expand `Onboarding.tsx` with university/course selection steps
4. **Settings**: Add university/course section to `Settings.tsx`
5. **Community hook**: Create `useCommunity.ts` with all React Query hooks
6. **Community page**: Build `Community.tsx` with feed tabs
7. **Community components**: Build `PostCard`, `CreatePostDialog`, `CommentSection`, `GroupInfo`
8. **Navigation**: Update sidebar, bottom nav, and router

---

### Technical Details

**University list** (hardcoded constant, expandable):
A predefined array of Nigerian universities (UNILAG, OAU, UI, LASU, ABU, UNILORIN, etc.) matching the logos already in `src/assets/logos/`. Includes an "Other" option where the user types the name.

**Auto-group flow:**
```text
User saves university + course
  --> UPDATE profiles SET university=..., course_of_study=...
  --> RPC upsert_user_group(university, course_of_study)
      --> INSERT INTO study_groups ON CONFLICT DO NOTHING
      --> DELETE FROM study_group_members WHERE user_id = auth.uid()
      --> INSERT INTO study_group_members (group_id, user_id)
      --> UPDATE member_count on old and new groups
```

**Files to create:**
- `src/pages/Community.tsx`
- `src/components/community/PostCard.tsx`
- `src/components/community/CreatePostDialog.tsx`
- `src/components/community/CommentSection.tsx`
- `src/components/community/GroupInfo.tsx`
- `src/hooks/useCommunity.ts`

**Files to modify:**
- `src/hooks/useProfile.ts` -- add university, course_of_study to interface
- `src/pages/Onboarding.tsx` -- multi-step form with university/course selection
- `src/pages/Settings.tsx` -- new University and Course section
- `src/components/DashboardSidebar.tsx` -- add Community menu item
- `src/components/BottomNav.tsx` -- replace Settings with Community
- `src/App.tsx` -- add /community route

**Database migration:** 1 migration file with all schema changes, RLS policies, and the `upsert_user_group` function.

