

## Plan: Export My Data as Professional PDF

### Overview

Implement a comprehensive "Export My Data" feature that fetches all user data from the database and generates a beautifully formatted, professional PDF document using the browser's print functionality.

---

### Data to Export

Based on the database schema, we'll export:

| Category | Table | Key Fields |
|----------|-------|------------|
| **Profile** | `profiles` | name, email, storage usage, account created date |
| **Courses** | `courses` | title, code, color, created date |
| **Assignments** | `assignments` | title, course, due date, priority, status |
| **Documents** | `user_files` | file name, size, upload date |
| **Flashcards** | `flashcards` | front, back, deck name |
| **Quiz History** | `quiz_sessions` + `quiz_questions` | document name, score, questions, date |
| **Study Stats** | `study_events` | event type, metadata, timestamps |
| **Weekly Goals** | `weekly_goals` | targets and progress |

---

### Implementation

#### File 1: `src/utils/exportUserData.ts` (NEW)

Create a new utility file with two main functions:

```typescript
// 1. fetchAllUserData - Fetches all data from Supabase
export const fetchAllUserData = async (userId: string) => {
  // Parallel fetch all tables for performance
  const [profile, courses, assignments, documents, flashcards, quizSessions, studyEvents, weeklyGoals] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('courses').select('*').eq('user_id', userId),
    supabase.from('assignments').select('*').eq('user_id', userId),
    supabase.from('user_files').select('*').eq('user_id', userId),
    supabase.from('flashcards').select('*').eq('user_id', userId),
    supabase.from('quiz_sessions').select('*, quiz_questions(*)').eq('user_id', userId),
    supabase.from('study_events').select('*').eq('user_id', userId),
    supabase.from('weekly_goals').select('*').eq('user_id', userId),
  ]);
  
  return { profile, courses, assignments, documents, flashcards, quizSessions, studyEvents, weeklyGoals };
};

// 2. exportUserDataAsPDF - Generates professional PDF
export const exportUserDataAsPDF = async (userId: string, userName: string) => {
  const data = await fetchAllUserData(userId);
  
  // Generate styled HTML with sections for each data type
  const htmlContent = generatePDFHTML(data, userName);
  
  // Open in new window and trigger print
  const printWindow = window.open('', '_blank');
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.onload = () => printWindow.print();
};
```

**PDF Design (Professional Styling):**

- **Header**: StudyFlow logo, user name, export date
- **Color scheme**: Purple accent (#7C3AED) matching brand
- **Typography**: Clean system fonts, proper hierarchy
- **Sections**: Clear dividers, icons, organized tables
- **Print optimization**: Page breaks, margins, avoiding orphan content

**Section Layout:**

```text
┌─────────────────────────────────────────────┐
│  📚 StudyFlow Data Export                   │
│  [User Name] • Exported on [Date]           │
├─────────────────────────────────────────────┤
│                                             │
│  👤 PROFILE                                 │
│  ─────────────────────────────────────────  │
│  Email: user@example.com                    │
│  Member since: Jan 2024                     │
│  Storage: 25MB / 50MB                       │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  📖 COURSES (3)                             │
│  ─────────────────────────────────────────  │
│  • CS101 - Introduction to Programming      │
│  • MATH201 - Linear Algebra                 │
│  • PHYS101 - Physics Fundamentals           │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  📝 ASSIGNMENTS (5)                         │
│  ─────────────────────────────────────────  │
│  [Table with title, course, due, status]    │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  📄 DOCUMENTS (8)                           │
│  ─────────────────────────────────────────  │
│  [Table with file name, size, date]         │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  🎴 FLASHCARDS (24)                         │
│  ─────────────────────────────────────────  │
│  [Grouped by deck, showing front/back]      │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  📊 QUIZ HISTORY (6)                        │
│  ─────────────────────────────────────────  │
│  [Table with quiz name, score, date]        │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  📈 STUDY STATISTICS                        │
│  ─────────────────────────────────────────  │
│  Total study events: 45                     │
│  Pomodoros completed: 12                    │
│  Documents analyzed: 8                      │
│                                             │
└─────────────────────────────────────────────┘
```

---

#### File 2: `src/pages/Settings.tsx` (UPDATE)

Update the Settings page to wire up the Export button:

```tsx
// Add import
import { exportUserDataAsPDF } from "@/utils/exportUserData";

// Add state
const [isExporting, setIsExporting] = useState(false);

// Add handler
const handleExportData = async () => {
  if (!user) return;
  setIsExporting(true);
  try {
    await exportUserDataAsPDF(user.id, user.user_metadata?.full_name || user.email || 'User');
    toast({
      title: "Export Ready",
      description: "Your data export is ready. Use your browser's print dialog to save as PDF."
    });
  } catch (error) {
    toast({
      title: "Export Failed",
      description: "Could not export your data. Please try again.",
      variant: "destructive"
    });
  } finally {
    setIsExporting(false);
  }
};

// Update the Export button (line 302-305)
<Button 
  variant="outline" 
  size="sm" 
  onClick={handleExportData}
  disabled={isExporting}
>
  {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
  {isExporting ? "Exporting..." : "Export"}
</Button>
```

---

### Technical Details

#### PDF Styling (CSS in generated HTML)

```css
/* Professional print styles */
body { 
  font-family: 'Segoe UI', system-ui, sans-serif;
  color: #1f2937;
  line-height: 1.6;
  max-width: 800px;
  margin: 0 auto;
  padding: 40px;
}

.header {
  text-align: center;
  border-bottom: 3px solid #7C3AED;
  padding-bottom: 20px;
  margin-bottom: 30px;
}

.section {
  margin-bottom: 30px;
  page-break-inside: avoid;
}

.section-title {
  color: #7C3AED;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 8px;
  margin-bottom: 16px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  text-align: left;
  padding: 10px;
  border-bottom: 1px solid #e5e7eb;
}

th {
  background: #f9fafb;
  font-weight: 600;
}

.flashcard {
  background: #f3f4f6;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
}

@media print {
  body { padding: 20px; }
  .section { page-break-inside: avoid; }
  .no-print { display: none; }
}
```

---

### Files to be Modified/Created

| File | Action |
|------|--------|
| `src/utils/exportUserData.ts` | **CREATE** - New utility with fetch + PDF generation |
| `src/pages/Settings.tsx` | **UPDATE** - Wire up Export button with loading state |

---

### User Flow

1. User clicks "Export" button in Settings > Data & Privacy
2. Button shows loading spinner
3. All user data is fetched from Supabase in parallel
4. Professional HTML document is generated with all data
5. New browser tab opens with the formatted document
6. Browser print dialog appears (user can save as PDF or print)
7. Toast notification confirms export is ready

---

### Edge Cases Handled

- **Empty data**: Sections show "No [items] yet" instead of empty tables
- **Large datasets**: Flashcards grouped by deck, quizzes summarized
- **Missing profile**: Graceful fallback to email/default values
- **Export failure**: Error toast with retry option
- **Print cancellation**: No issues, window can be closed

