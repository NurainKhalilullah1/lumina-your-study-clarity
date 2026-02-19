## Plan: Fix AI Tutor Scroll, Flashcard Generation, and API Usage

### Issues Identified

1. **Auto-scroll on page load**: The Tutor page has a `useEffect` that scrolls to `messagesEndRef` whenever `messages` or `isLoading` changes. On initial load, this triggers a scroll to the bottom of the StarterCards view, pushing the page down.
2. **Flashcard generation shows text first**: The `FlashcardGenerator` component is a button in the header toolbar that only appears when `messages.length > 0`. When triggered from StarterCards (before any messages exist), the button isn't rendered, so the `triggerGenerate` prop has no effect. The flashcard generation needs to work even with zero messages.
3. **Pomodoro auto-start**: Already fixed in the codebase. If still happening, it's a browser cache issue.
4. **API rate limit concerns**: The app calls Google Gemini directly from the frontend using `VITE_GEMINI_API_KEY`. Every feature (chat, flashcard gen, title gen) makes separate API calls. This is both a security risk (exposed key) and a rate limit concern.

---

### Changes

#### 1. Fix Auto-Scroll on Tutor Page Load

**File: `src/pages/Tutor.tsx**`

- Modify the scroll `useEffect` to only scroll when there are actual messages, preventing the unwanted scroll on initial page load with StarterCards.

#### 2. Fix Flashcard Generator Visibility

**File: `src/pages/Tutor.tsx**`

- Remove the `messages.length > 0` condition that gates the `FlashcardGenerator` rendering. The component should always be rendered so it can respond to the `triggerGenerate` prop from StarterCards.
- When triggered from StarterCards without a document loaded, show a toast asking the user to upload a document first.

#### 3. Fix Flashcard StarterCard Behavior

**File: `src/components/tutor/FlashcardGenerator.tsx**`

- Ensure the component checks for `activeDocument` content when triggered externally, and prompts the user to load a document if none is available.

#### 4. Improve ChatInput Sync

**File: `src/components/tutor/ChatInput.tsx**`

- Fix the controlled input sync issue where `onValueChange` isn't called in `handleMessageChange` during typing (line 143 uses `setMessage` directly instead of `handleMessageChange`).

#### 5. API Usage Management Strategy

**No code changes needed for now**, but here's the approach:

- The current setup uses `gemini-2.5-flash` which has generous free-tier limits (15 RPM, 1M TPM for free).
- **Title generation** is the most wasteful call -- it makes a second API call after every new chat. We can reduce this by generating titles from the first message/response locally instead of using AI.
- **Flashcard generation** truncates content to 8K chars which is reasonable.
- **Chat context** truncates to 25K chars and uses last 6 messages -- also reasonable.
- Long-term, moving to Supabase Edge Functions with the Lovable AI Gateway would be more secure and manageable, but that's a bigger migration.

---

### Technical Details


| File                                 | Change                                                                                                                 |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `src/pages/Tutor.tsx`                | Guard scroll effect with `messages.length > 0`; always render FlashcardGenerator                                       |
| `src/components/tutor/ChatInput.tsx` | Fix input onChange to use `handleMessageChange`                                                                        |
| `src/pages/Tutor.tsx`                | Optimize title generation to avoid extra API call (use first message substring as title instead of AI-generated title) |


### API Optimization Summary

- Keep chat, flashcard, and vision calls as-is (core features)
- The Gemini 2.5 Flash free tier supports 15 requests/minute and 1 million tokens/minute, which should be sufficient for normal study usage
- If limits are hit, the app already shows error toasts via the catch block