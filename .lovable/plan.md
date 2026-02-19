

## Plan: Fix Flashcard Generation and Remove Auto-Start Timer

### 1. Fix Flashcard Generation (Starter Card)

**Problem**: Clicking the "Flashcards" starter card sends a text prompt to the AI chat, which responds with plain text flashcards in the chat bubble. The user expects visual, interactive flashcard cards.

**Solution**: When the "Flashcards" starter card is clicked, instead of sending a chat message, directly trigger the `FlashcardGenerator` component to generate proper visual flip-cards with front/back sides.

**Files to change:**

- **`src/components/tutor/StarterCards.tsx`**: Change the Flashcards card to call a new callback (e.g., `onGenerateFlashcards`) instead of populating the input field with text.
- **`src/pages/Tutor.tsx`**: Add a ref or state to programmatically trigger the `FlashcardGenerator` when the Flashcards starter card is clicked. Pass the trigger callback down to `StarterCards`.

**How it works:**
- The Flashcards starter card will call `onGenerateFlashcards()` instead of `onSetInputText(prompt)`
- `Tutor.tsx` will handle this by triggering the `FlashcardGenerator`'s generate function using the active document content
- The `FlashcardGenerator` already has the proper UI with a dialog showing visual flip-cards

### 2. Remove Auto-Start Timer

**Problem**: The Pomodoro timer automatically starts 10 seconds after login, which the user doesn't want.

**File to change:**

- **`src/contexts/PomodoroContext.tsx`**: Remove the auto-start `useEffect` (lines ~148-158) that triggers `start()` after a 10-second timeout. Keep all other functionality (manual start, persistence across pages, etc.) intact.

---

### Technical Details

**StarterCards changes:**
- Add `onGenerateFlashcards` optional prop
- Flashcards card calls `onGenerateFlashcards()` instead of `onSetInputText(prompt)`
- Other starter cards remain unchanged

**Tutor.tsx changes:**
- Lift FlashcardGenerator's generate logic: add state like `triggerFlashcardGen` to programmatically open the generator
- Pass `handleGenerateFlashcards` callback to `StarterCards`

**PomodoroContext changes:**
- Remove the auto-start `useEffect` block and `hasAutoStarted` state
- Timer will only start when user manually clicks play

### Files Summary

| File | Action |
|------|--------|
| `src/components/tutor/StarterCards.tsx` | UPDATE - Flashcards card triggers generation callback |
| `src/pages/Tutor.tsx` | UPDATE - Handle flashcard generation trigger |
| `src/components/tutor/FlashcardGenerator.tsx` | UPDATE - Support external trigger via prop |
| `src/contexts/PomodoroContext.tsx` | UPDATE - Remove auto-start logic |

