// Pure gamification functions — no side effects, no API calls

export const LEAGUE_NAMES = [
  'Bronze I', 'Bronze II', 'Bronze III',
  'Silver I', 'Silver II', 'Silver III',
  'Gold I', 'Gold II', 'Gold III',
  'Platinum I', 'Platinum II', 'Platinum III',
  'Diamond I', 'Diamond II', 'Diamond III',
  'Ruby I', 'Ruby II', 'Ruby III',
  'Emerald I', 'Emerald II', 'Emerald III',
  'Champion I', 'Champion II', 'Champion III',
  'Legend',
] as const;

export function getLeagueName(league: number): string {
  if (league < 1 || league > 25) return 'Unknown';
  return LEAGUE_NAMES[league - 1];
}

export function getLeagueColor(league: number): string {
  if (league <= 3) return 'text-amber-700';
  if (league <= 6) return 'text-slate-400';
  if (league <= 9) return 'text-yellow-500';
  if (league <= 12) return 'text-cyan-400';
  if (league <= 15) return 'text-blue-400';
  if (league <= 18) return 'text-red-500';
  if (league <= 21) return 'text-emerald-500';
  if (league <= 24) return 'text-purple-500';
  return 'text-amber-400'; // Legend
}

export function getCurrentWeekStart(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun
  const diff = day === 0 ? 6 : day - 1; // Monday = 0
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff));
  return monday;
}

export function getWeekEndDate(): Date {
  const start = getCurrentWeekStart();
  return new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
}

export const XP_VALUES = {
  pomodoro_completed: 25,
  flashcard_reviewed: 5,
  document_analyzed: 20,
  quiz_completed: 20,
  quiz_score_70: 20,
  quiz_score_90: 40, // stacks with 70
  quiz_improvement: 30,
  daily_activity: 10,
} as const;

export const LEVEL_TITLES = [
  'Freshman',
  'Learner',
  'Scholar',
  'Expert',
  'Master',
  'Sage',
  'Legend',
  'Grandmaster',
] as const;

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  bonusXP: number;
  category: 'focus' | 'flashcards' | 'quiz' | 'streak' | 'milestone';
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_focus', name: 'First Focus', description: 'Complete your first pomodoro session', icon: '🎯', bonusXP: 15, category: 'focus' },
  { id: 'focus_warrior', name: 'Focus Warrior', description: 'Complete 25 pomodoro sessions', icon: '⚔️', bonusXP: 75, category: 'focus' },
  { id: 'focus_legend', name: 'Focus Legend', description: 'Complete 100 pomodoro sessions', icon: '🔥', bonusXP: 200, category: 'focus' },
  { id: 'card_collector', name: 'Card Collector', description: 'Review 50 flashcards', icon: '🃏', bonusXP: 40, category: 'flashcards' },
  { id: 'card_master', name: 'Card Master', description: 'Review 500 flashcards', icon: '🏆', bonusXP: 150, category: 'flashcards' },
  { id: 'quiz_ace', name: 'Quiz Ace', description: 'Score 90%+ on any quiz', icon: '💯', bonusXP: 50, category: 'quiz' },
  { id: 'quiz_streak', name: 'Quiz Streak', description: 'Score 70%+ on 5 quizzes in a row', icon: '🎯', bonusXP: 75, category: 'quiz' },
  { id: 'questions_100', name: '100 Questions Mastered', description: 'Answer 100 questions correctly', icon: '🧠', bonusXP: 100, category: 'quiz' },
  { id: 'streak_3', name: '3-Day Streak', description: 'Study 3 consecutive days', icon: '📅', bonusXP: 40, category: 'streak' },
  { id: 'streak_7', name: '7-Day Streak', description: 'Study 7 consecutive days', icon: '🗓️', bonusXP: 100, category: 'streak' },
  { id: 'streak_14', name: '14-Day Streak', description: 'Study 14 consecutive days', icon: '🌟', bonusXP: 200, category: 'streak' },
  { id: 'streak_30', name: '30-Day Streak', description: 'Study 30 consecutive days', icon: '👑', bonusXP: 400, category: 'streak' },
  { id: 'comeback_kid', name: 'Comeback Kid', description: 'Improve your quiz score on a previously failed topic', icon: '💪', bonusXP: 60, category: 'quiz' },
  { id: 'bookworm', name: 'Bookworm', description: 'Analyze 10 documents', icon: '📚', bonusXP: 50, category: 'milestone' },
  { id: 'scholar', name: 'Scholar', description: 'Reach Level 5', icon: '🎓', bonusXP: 100, category: 'milestone' },
];

export interface LevelInfo {
  level: number;
  title: string;
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progress: number; // 0-100
}

function getXPThreshold(level: number): number {
  if (level <= 1) return 0;
  return Math.round(35 * Math.pow(level, 1.4));
}

export function getCumulativeXPForLevel(level: number): number {
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += getXPThreshold(i);
  }
  return total;
}

export function getLevelFromXP(xp: number): LevelInfo {
  let level = 1;
  let cumulative = 0;

  while (true) {
    const nextThreshold = getXPThreshold(level + 1);
    if (cumulative + nextThreshold > xp) break;
    cumulative += nextThreshold;
    level++;
    if (level >= 50) break; // safety cap
  }

  const xpInCurrentLevel = xp - cumulative;
  const xpNeededForNext = getXPThreshold(level + 1);
  const progress = xpNeededForNext > 0 ? Math.min(100, Math.round((xpInCurrentLevel / xpNeededForNext) * 100)) : 100;

  const titleIndex = Math.min(level - 1, LEVEL_TITLES.length - 1);

  return {
    level,
    title: LEVEL_TITLES[titleIndex],
    currentXP: xp,
    xpForCurrentLevel: cumulative,
    xpForNextLevel: cumulative + xpNeededForNext,
    progress,
  };
}

export interface StudyEventData {
  event_type: string;
  created_at: string;
  metadata?: Record<string, any> | null;
}

export interface QuizSessionData {
  id: string;
  score: number | null;
  total_questions: number | null;
  completed_at: string | null;
  document_name: string | null;
}

export interface QuizQuestionData {
  quiz_session_id: string;
  user_answer: string | null;
  correct_answer: string;
}

export interface XPBreakdown {
  totalXP: number;
  pomodoroXP: number;
  flashcardXP: number;
  documentXP: number;
  quizXP: number;
  dailyXP: number;
  achievementXP: number;
}

export function calculateXPFromEvents(
  events: StudyEventData[],
  quizSessions: QuizSessionData[],
  quizQuestions: QuizQuestionData[],
  streakDays: number
): XPBreakdown {
  let pomodoroXP = 0;
  let flashcardXP = 0;
  let documentXP = 0;
  let quizXP = 0;
  let dailyXP = 0;

  // Count events by type
  let pomodoroCount = 0;
  let flashcardCount = 0;
  let documentCount = 0;

  events.forEach(e => {
    switch (e.event_type) {
      case 'pomodoro_completed':
        pomodoroCount++;
        pomodoroXP += XP_VALUES.pomodoro_completed;
        break;
      case 'flashcard_reviewed':
        flashcardCount++;
        flashcardXP += XP_VALUES.flashcard_reviewed;
        break;
      case 'document_analyzed':
        documentCount++;
        documentXP += XP_VALUES.document_analyzed;
        break;
    }
  });

  // Daily activity XP — count unique active days
  const uniqueDays = new Set(events.map(e => new Date(e.created_at).toDateString()));
  dailyXP = uniqueDays.size * XP_VALUES.daily_activity;

  // Quiz XP
  const completedQuizzes = quizSessions.filter(q => q.completed_at && q.score !== null && q.total_questions);
  
  // Track best scores per document for improvement detection
  const bestScores: Record<string, number> = {};
  
  completedQuizzes.forEach(q => {
    quizXP += XP_VALUES.quiz_completed;
    
    const percentage = q.total_questions ? (q.score! / q.total_questions) * 100 : 0;
    
    if (percentage >= 70) quizXP += XP_VALUES.quiz_score_70;
    if (percentage >= 90) quizXP += XP_VALUES.quiz_score_90;
    
    // Check improvement
    const docKey = q.document_name || q.id;
    if (bestScores[docKey] !== undefined && percentage > bestScores[docKey]) {
      quizXP += XP_VALUES.quiz_improvement;
    }
    bestScores[docKey] = Math.max(bestScores[docKey] || 0, percentage);
  });

  // Achievement bonus XP
  const earnedAchievements = checkAchievements(events, quizSessions, quizQuestions, streakDays);
  const achievementXP = earnedAchievements.reduce((sum, id) => {
    const a = ACHIEVEMENTS.find(a => a.id === id);
    return sum + (a?.bonusXP || 0);
  }, 0);

  const totalXP = pomodoroXP + flashcardXP + documentXP + quizXP + dailyXP + achievementXP;

  return { totalXP, pomodoroXP, flashcardXP, documentXP, quizXP, dailyXP, achievementXP };
}

export function checkAchievements(
  events: StudyEventData[],
  quizSessions: QuizSessionData[],
  quizQuestions: QuizQuestionData[],
  streakDays: number
): string[] {
  const earned: string[] = [];

  const pomodoroCount = events.filter(e => e.event_type === 'pomodoro_completed').length;
  const flashcardCount = events.filter(e => e.event_type === 'flashcard_reviewed').length;
  const documentCount = events.filter(e => e.event_type === 'document_analyzed').length;

  // Focus achievements
  if (pomodoroCount >= 1) earned.push('first_focus');
  if (pomodoroCount >= 25) earned.push('focus_warrior');
  if (pomodoroCount >= 100) earned.push('focus_legend');

  // Flashcard achievements
  if (flashcardCount >= 50) earned.push('card_collector');
  if (flashcardCount >= 500) earned.push('card_master');

  // Quiz achievements
  const completedQuizzes = quizSessions
    .filter(q => q.completed_at && q.score !== null && q.total_questions)
    .sort((a, b) => new Date(a.completed_at!).getTime() - new Date(b.completed_at!).getTime());

  const hasAce = completedQuizzes.some(q => q.total_questions && (q.score! / q.total_questions) * 100 >= 90);
  if (hasAce) earned.push('quiz_ace');

  // Quiz streak: 5 consecutive quizzes with 70%+
  let consecutiveGood = 0;
  let hasQuizStreak = false;
  for (const q of completedQuizzes) {
    const pct = q.total_questions ? (q.score! / q.total_questions) * 100 : 0;
    if (pct >= 70) {
      consecutiveGood++;
      if (consecutiveGood >= 5) { hasQuizStreak = true; break; }
    } else {
      consecutiveGood = 0;
    }
  }
  if (hasQuizStreak) earned.push('quiz_streak');

  // 100 correct answers
  const correctCount = quizQuestions.filter(q => q.user_answer === q.correct_answer).length;
  if (correctCount >= 100) earned.push('questions_100');

  // Comeback kid - improved on a previously failed topic
  const scoresByDoc: Record<string, number[]> = {};
  completedQuizzes.forEach(q => {
    const key = q.document_name || q.id;
    const pct = q.total_questions ? (q.score! / q.total_questions) * 100 : 0;
    if (!scoresByDoc[key]) scoresByDoc[key] = [];
    scoresByDoc[key].push(pct);
  });
  const hasComeback = Object.values(scoresByDoc).some(scores => {
    if (scores.length < 2) return false;
    const hadFail = scores.some(s => s < 70);
    const lastScore = scores[scores.length - 1];
    return hadFail && lastScore >= 70;
  });
  if (hasComeback) earned.push('comeback_kid');

  // Streak achievements
  if (streakDays >= 3) earned.push('streak_3');
  if (streakDays >= 7) earned.push('streak_7');
  if (streakDays >= 14) earned.push('streak_14');
  if (streakDays >= 30) earned.push('streak_30');

  // Bookworm
  if (documentCount >= 10) earned.push('bookworm');

  return earned;
}

export function calculateStreakDays(events: StudyEventData[]): number {
  if (events.length === 0) return 0;
  
  const uniqueDays = new Set(events.map(e => new Date(e.created_at).toDateString()));
  
  let streak = 0;
  const checkDate = new Date();

  // If no activity today, start counting from yesterday (streak still alive until end of day)
  if (!uniqueDays.has(checkDate.toDateString())) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (uniqueDays.has(checkDate.toDateString())) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  return streak;
}
