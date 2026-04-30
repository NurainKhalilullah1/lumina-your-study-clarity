# Lumina Master Design System
This is the global source of truth for the Lumina project, generated using the **UI/UX Pro Max** reasoning engine.

## Core Identity
- **Product Type:** EdTech / Study Clarity Platform
- **Visual Style:** Bento Box Grid + Motion-Driven
- **Mood:** Professional, Friendly, Trustworthy

## Color Palette
| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#4F46E5` | Branding, Primary Buttons, Active States |
| Secondary | `#818CF8` | Supporting elements, subtle backgrounds |
| CTA | `#F97316` | Main Call-to-Actions, High-contrast highlights |
| Success | `#10B981` | Progress bars, achievements, badges |
| Background | `#F8FAFC` | Light mode background |
| Card BG | `#FFFFFF` | Bento grid cards |
| Text (Primary)| `#1E1B4B` | Main headings and body text |
| Text (Muted) | `#475569` | Secondary text, descriptions |
| Border | `#E2E8F0` | Default card borders |

## Typography
- **Headings:** [Outfit](https://fonts.google.com/specimen/Outfit) (Bold/Semibold)
- **Body:** [Work Sans](https://fonts.google.com/specimen/Work+Sans) (Regular/Medium)
- **Import:** `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700&family=Work+Sans:wght@400;500&display=swap');`

## Effects & Components
- **Card Styling:** 
  - Border-radius: `24px`
  - Shadow: `0 4px 6px rgba(0,0,0,0.05)`
  - Hover: `scale(1.02)` + `shadow-lg`
- **Transitions:** `200ms cubic-bezier(0.4, 0, 0.2, 1)`
- **Interactions:** Subtle glow pulse for CTA buttons.

## UX Guidelines
- [x] WCAG AA contrast (4.5:1 minimum)
- [x] Clear focus states for keyboard navigation
- [x] Large touch targets (44px min for mobile)
- [x] Avoid "AI purple/pink gradients" in serious study areas; use calming indigos.
