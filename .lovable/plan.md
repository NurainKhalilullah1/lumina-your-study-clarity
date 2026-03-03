## Pricing Table + Manual Payment Upgrade System

### Overview

Add a pricing section to the landing page with 3 tiers (Free, Pro, Premium), and build a manual bank transfer upgrade flow in the dashboard. Users upload a receipt or enter a transaction reference. An admin panel verifies payments and upgrades user tiers.

### Pricing Tiers

- **Free**: Current limits (50MB storage, 10 quiz questions, basic AI tutor)
- **Pro** (~₦2,000/mo): 200MB storage, 20 quiz questions, priority AI, unlimited flashcards
- **Premium** (~₦5,000/mo): 300MB storage, unlimited quizzes, advanced AI, all features unlocked

### Database Changes (Migration)

**1. `subscription_tiers` enum or use text column**

**2. New `upgrade_requests` table:**

- `id`, `user_id`, `requested_tier` (text: 'pro'/'premium'), `amount` (integer), `payment_reference` (text, nullable), `receipt_url` (text, nullable), `status` (text: 'pending'/'approved'/'rejected', default 'pending'), `admin_note` (text, nullable), `created_at`, `reviewed_at`, `reviewed_by` (uuid, nullable)
- RLS: users can INSERT their own, SELECT their own; admins can SELECT/UPDATE all (via `has_role` function)

**3. Add `subscription_tier` column to `profiles` table:**

- `subscription_tier text NOT NULL DEFAULT 'free'`

**4. Create `user_roles` table** (per security guidelines):

- `id`, `user_id`, `role` (app_role enum: 'admin', 'moderator', 'user')
- Plus `has_role()` security definer function

**5. New `receipts` storage bucket** (public: false) for uploaded receipt images.

### Frontend Changes

**File 1: `src/components/PricingSection.tsx` (NEW)**

- 3-column pricing cards (Free, Pro, Premium) with feature lists, prices in ₦
- "Get Started" for Free, "Upgrade" buttons for Pro/Premium linking to `/auth` or `/settings` (upgrade dialog)
- Animated with framer-motion, responsive grid

**File 2: `src/pages/Index.tsx**`

- Import and add `<PricingSection />` between SolutionSection and CTASection

**File 3: `src/components/UpgradeDialog.tsx` (NEW)**

- Modal dialog showing selected tier details + bank transfer instructions (placeholder)
- Two proof options: upload receipt image OR enter transaction reference
- Submit creates a row in `upgrade_requests` and uploads receipt to storage
- Shows pending/approved/rejected status of existing requests

**File 4: `src/pages/Settings.tsx**`

- Add "Subscription" section showing current tier + upgrade button
- Shows current tier badge, opens UpgradeDialog for upgrades
- Shows history of upgrade requests with status

**File 5: `src/components/dashboard/StorageIndicator.tsx**`

- Update to reflect tier-based storage limits (reads `subscription_tier` from profile)

**File 6: `src/pages/Admin.tsx` (NEW)**

- Protected admin page (checks `has_role(uid, 'admin')`)
- Lists pending upgrade requests with user info, receipt preview, reference number
- Approve/Reject buttons that update `upgrade_requests.status` and `profiles.subscription_tier`

**File 7: `src/App.tsx**`

- Add `/admin` route (protected)

**File 8: `src/hooks/useSubscription.ts` (NEW)**

- Hook to fetch current user's tier and upgrade request history

### Flow

1. User sees pricing on landing page or in Settings
2. Clicks "Upgrade to Pro/Premium"
3. Dialog shows bank details + amount
4. User uploads receipt screenshot or enters reference
5. Request goes to `upgrade_requests` as 'pending'
6. Admin visits `/admin`, reviews, approves/rejects
7. On approval, `profiles.subscription_tier` updates, user gets expanded limits
8. Ensures that all the features for each plan are integrated