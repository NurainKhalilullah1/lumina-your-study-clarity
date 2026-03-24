# StudyFlow 📚

**StudyFlow** is an AI-powered study companion built for Nigerian university students. It brings together everything you need to study smarter — from an AI tutor and quiz generator to flashcards, a Pomodoro timer, and a university-based community — all in one app.

## ✨ Features

### 🤖 AI Tutor
- Chat-based AI tutor powered by Google Gemini
- Upload documents and images for context-aware help
- Conversation history with multiple sessions
- Export chat conversations

### 📝 Quiz Generator
- Auto-generate quizzes from your uploaded documents
- Configurable number of questions and time limits
- Flagging, review, and detailed results with score tracking
- Full quiz history and analytics

### 🃏 Flashcards
- AI-generated flashcards from your study materials
- Flip-card viewer with deck management
- Create flashcards directly from tutor conversations

### 📄 Document Management
- Upload and manage PDFs and study materials
- Automatic text extraction for AI features
- Storage quota tracking per user

### ⏱️ Pomodoro Timer
- Built-in Pomodoro timer with customizable durations
- Persistent across pages via global context
- Tracks study time for gamification

### 📊 Dashboard & Analytics
- Study stats: time studied, quizzes taken, flashcards created
- Weekly goals with progress tracking
- XP system with levels and achievements

### 🏆 Gamification & Leaderboard
- Earn XP for studying, completing quizzes, and more
- Weekly leagues with promotion/demotion system
- Global and league-specific leaderboards
- Achievement badges

### 👥 Community
- University and course-based study groups (auto-joined)
- Create posts, upvote, and comment
- Filter by category: Questions, Resources, Discussion, Tips

### 📅 Assignments
- Track assignments with due dates, priority, and status
- Filter by course and type

### 📚 Courses
- Add and manage your university courses
- Color-coded course cards

### ⚙️ Settings
- Profile management (name, avatar, university, course of study)
- Customizable Pomodoro duration and default quiz questions
- Theme toggle (light/dark/system)
- Data export and account deletion

## 🏫 Supported Universities

- University of Lagos (UNILAG)
- University of Ibadan (UI)
- Obafemi Awolowo University (OAU)
- University of Ilorin (UNILORIN)
- Lagos State University (LASU)
- Ahmadu Bello University (ABU)

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| State Management | TanStack React Query, React Context |
| Routing | React Router v6 |
| Animation | Framer Motion |
| Backend | Supabase (Auth, Database, Storage, Edge Functions) |
| AI | Google Generative AI (Gemini) |
| Mobile | Capacitor (Android) |

## 📱 Mobile App (Android)

StudyFlow can be built as a native Android app using Capacitor. After cloning the repo:

```bash
# Install dependencies
npm install

# Add Android platform
npx cap add android

# Update native dependencies
npx cap update android

# Build the web app
npm run build

# Sync web assets to Android
npx cap sync

# Open in Android Studio
npx cap open android
```

Then hit **Run** in Android Studio to launch on your emulator or device.

> **Live Reload:** During development, the app connects to the Lovable preview server so changes appear instantly on your device.

## 🚀 Getting Started (Web)

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd studyflow

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`.

## 📁 Project Structure

```
src/
├── assets/          # Logos and static images
├── components/      # Reusable UI components
│   ├── community/   # Community feature components
│   ├── dashboard/   # Dashboard widgets
│   ├── documents/   # Document management components
│   ├── quiz/        # Quiz interface components
│   ├── tutor/       # AI tutor components
│   └── ui/          # shadcn/ui primitives
├── constants/       # App constants (universities, etc.)
├── contexts/        # React contexts (Auth, Pomodoro)
├── hooks/           # Custom React hooks
├── integrations/    # Supabase client and types
├── lib/             # Utility libraries
├── pages/           # Route page components
└── utils/           # Helper utilities
supabase/
├── functions/       # Edge functions
└── migrations/      # Database migrations
```

## 🔐 Authentication

- Email/password signup and login
- Onboarding flow for university and course selection
- Protected routes with automatic redirect
- Profile creation on first sign-up

## 📄 License

This project is proprietary. All rights reserved.

---

Built with ❤️ for Nigerian Student.
