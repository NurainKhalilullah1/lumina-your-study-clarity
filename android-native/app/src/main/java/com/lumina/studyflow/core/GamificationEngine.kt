package com.lumina.studyflow.core

// ─── League & Level Constants (ported from gamification.ts) ──────────────────

val LEAGUE_NAMES = listOf(
    "Bronze I", "Bronze II", "Bronze III",
    "Silver I", "Silver II", "Silver III",
    "Gold I", "Gold II", "Gold III",
    "Platinum I", "Platinum II", "Platinum III",
    "Diamond I", "Diamond II", "Diamond III",
    "Ruby I", "Ruby II", "Ruby III",
    "Emerald I", "Emerald II", "Emerald III",
    "Champion I", "Champion II", "Champion III",
    "Legend"
)

fun getLeagueName(league: Int): String =
    if (league in 1..25) LEAGUE_NAMES[league - 1] else "Unknown"

fun getLeagueColor(league: Int): Long = when {
    league <= 3  -> 0xFFB45309L   // amber-700
    league <= 6  -> 0xFF94A3B8L   // slate-400
    league <= 9  -> 0xFFEAB308L   // yellow-500
    league <= 12 -> 0xFF22D3EEL   // cyan-400
    league <= 15 -> 0xFF60A5FAL   // blue-400
    league <= 18 -> 0xFFEF4444L   // red-500
    league <= 21 -> 0xFF10B981L   // emerald-500
    league <= 24 -> 0xFFA855F7L   // purple-500
    else         -> 0xFFFBBF24L   // amber-400 (Legend)
}

val LEVEL_TITLES = listOf(
    "Freshman", "Learner", "Scholar", "Expert",
    "Master", "Sage", "Legend", "Grandmaster"
)

// ─── XP Values ────────────────────────────────────────────────────────────────

object XP {
    const val POMODORO_COMPLETED = 25
    const val FLASHCARD_REVIEWED = 5
    const val DOCUMENT_ANALYZED  = 20
    const val QUIZ_COMPLETED     = 20
    const val QUIZ_SCORE_70      = 20
    const val QUIZ_SCORE_90      = 40  // stacks with 70
    const val QUIZ_IMPROVEMENT   = 30
    const val DAILY_ACTIVITY     = 10
}

// ─── Achievements ─────────────────────────────────────────────────────────────

data class Achievement(
    val id: String,
    val name: String,
    val description: String,
    val icon: String,
    val bonusXP: Int,
    val category: String
)

val ACHIEVEMENTS = listOf(
    Achievement("first_focus",   "First Focus",           "Complete your first pomodoro session",             "🎯", 15,  "focus"),
    Achievement("focus_warrior", "Focus Warrior",         "Complete 25 pomodoro sessions",                    "⚔️", 75,  "focus"),
    Achievement("focus_legend",  "Focus Legend",          "Complete 100 pomodoro sessions",                   "🔥", 200, "focus"),
    Achievement("card_collector","Card Collector",        "Review 50 flashcards",                             "🃏", 40,  "flashcards"),
    Achievement("card_master",   "Card Master",           "Review 500 flashcards",                            "🏆", 150, "flashcards"),
    Achievement("quiz_ace",      "Quiz Ace",              "Score 90%+ on any quiz",                           "💯", 50,  "quiz"),
    Achievement("quiz_streak",   "Quiz Streak",           "Score 70%+ on 5 quizzes in a row",                 "🎯", 75,  "quiz"),
    Achievement("questions_100", "100 Questions Mastered","Answer 100 questions correctly",                    "🧠", 100, "quiz"),
    Achievement("streak_3",      "3-Day Streak",          "Study 3 consecutive days",                         "📅", 40,  "streak"),
    Achievement("streak_7",      "7-Day Streak",          "Study 7 consecutive days",                         "🗓️", 100, "streak"),
    Achievement("streak_14",     "14-Day Streak",         "Study 14 consecutive days",                        "🌟", 200, "streak"),
    Achievement("streak_30",     "30-Day Streak",         "Study 30 consecutive days",                        "👑", 400, "streak"),
    Achievement("comeback_kid",  "Comeback Kid",          "Improve score on a previously failed topic",        "💪", 60,  "quiz"),
    Achievement("bookworm",      "Bookworm",              "Analyze 10 documents",                             "📚", 50,  "milestone"),
    Achievement("scholar",       "Scholar",               "Reach Level 5",                                    "🎓", 100, "milestone"),
)

// ─── Data Classes ─────────────────────────────────────────────────────────────

data class StudyEventData(
    val event_type: String,
    val created_at: String,
    val metadata: Map<String, String>? = null
)

data class QuizSessionData(
    val id: String,
    val score: Int?,
    val total_questions: Int?,
    val completed_at: String?,
    val document_name: String?
)

data class QuizQuestionData(
    val quiz_session_id: String,
    val user_answer: String?,
    val correct_answer: String
)

data class LevelInfo(
    val level: Int,
    val title: String,
    val currentXP: Int,
    val xpForCurrentLevel: Int,
    val xpForNextLevel: Int,
    val progress: Float  // 0..1
)

data class XPBreakdown(
    val totalXP: Int,
    val pomodoroXP: Int,
    val flashcardXP: Int,
    val documentXP: Int,
    val quizXP: Int,
    val dailyXP: Int,
    val achievementXP: Int
)

// ─── Pure Functions ────────────────────────────────────────────────────────────

private fun getXPThreshold(level: Int): Int {
    if (level <= 1) return 0
    return (35 * Math.pow(level.toDouble(), 1.4)).toInt()
}

fun getLevelFromXP(xp: Int): LevelInfo {
    var level = 1
    var cumulative = 0

    while (true) {
        val nextThreshold = getXPThreshold(level + 1)
        if (cumulative + nextThreshold > xp) break
        cumulative += nextThreshold
        level++
        if (level >= 50) break
    }

    val xpInCurrentLevel = xp - cumulative
    val xpNeededForNext = getXPThreshold(level + 1)
    val progress = if (xpNeededForNext > 0)
        (xpInCurrentLevel.toFloat() / xpNeededForNext).coerceIn(0f, 1f)
    else 1f

    val titleIndex = (level - 1).coerceAtMost(LEVEL_TITLES.size - 1)

    return LevelInfo(
        level = level,
        title = LEVEL_TITLES[titleIndex],
        currentXP = xp,
        xpForCurrentLevel = cumulative,
        xpForNextLevel = cumulative + xpNeededForNext,
        progress = progress
    )
}

fun calculateStreakDays(events: List<StudyEventData>): Int {
    if (events.isEmpty()) return 0
    val fmt = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault())
    val uniqueDays = events.mapNotNull { runCatching { fmt.format(java.util.Date(it.created_at.take(10).replace("-", "").let {
        java.text.SimpleDateFormat("yyyyMMdd", java.util.Locale.getDefault()).parse(it)!!.time
    })) }.getOrNull() }.toSet()

    var streak = 0
    val cal = java.util.Calendar.getInstance()
    if (!uniqueDays.contains(fmt.format(cal.time))) {
        cal.add(java.util.Calendar.DATE, -1)
    }
    while (uniqueDays.contains(fmt.format(cal.time))) {
        streak++
        cal.add(java.util.Calendar.DATE, -1)
    }
    return streak
}

fun calculateXPFromEvents(
    events: List<StudyEventData>,
    quizSessions: List<QuizSessionData>,
    quizQuestions: List<QuizQuestionData>,
    streakDays: Int
): XPBreakdown {
    var pomodoroXP = 0
    var flashcardXP = 0
    var documentXP = 0
    var quizXP = 0

    events.forEach { e ->
        when (e.event_type) {
            "pomodoro_completed"  -> pomodoroXP += XP.POMODORO_COMPLETED
            "flashcard_reviewed"  -> flashcardXP += XP.FLASHCARD_REVIEWED
            "document_analyzed"   -> documentXP  += XP.DOCUMENT_ANALYZED
        }
    }

    // Daily XP
    val uniqueDays = events.map { it.created_at.take(10) }.toSet()
    val dailyXP = uniqueDays.size * XP.DAILY_ACTIVITY

    // Quiz XP
    val completedQuizzes = quizSessions.filter { it.completed_at != null && it.score != null && it.total_questions != null }
    val bestScores = mutableMapOf<String, Float>()
    completedQuizzes.forEach { q ->
        quizXP += XP.QUIZ_COMPLETED
        val pct = (q.score!!.toFloat() / q.total_questions!!) * 100f
        if (pct >= 70) quizXP += XP.QUIZ_SCORE_70
        if (pct >= 90) quizXP += XP.QUIZ_SCORE_90
        val key = q.document_name ?: q.id
        val prev = bestScores[key]
        if (prev != null && pct > prev) quizXP += XP.QUIZ_IMPROVEMENT
        bestScores[key] = maxOf(prev ?: 0f, pct)
    }

    val earned = checkAchievements(events, quizSessions, quizQuestions, streakDays)
    val achievementXP = earned.sumOf { id -> ACHIEVEMENTS.find { it.id == id }?.bonusXP ?: 0 }

    val totalXP = pomodoroXP + flashcardXP + documentXP + quizXP + dailyXP + achievementXP
    return XPBreakdown(totalXP, pomodoroXP, flashcardXP, documentXP, quizXP, dailyXP, achievementXP)
}

fun checkAchievements(
    events: List<StudyEventData>,
    quizSessions: List<QuizSessionData>,
    quizQuestions: List<QuizQuestionData>,
    streakDays: Int
): List<String> {
    val earned = mutableListOf<String>()
    val pomodoroCount = events.count { it.event_type == "pomodoro_completed" }
    val flashcardCount = events.count { it.event_type == "flashcard_reviewed" }
    val documentCount  = events.count { it.event_type == "document_analyzed" }

    if (pomodoroCount >= 1)   earned += "first_focus"
    if (pomodoroCount >= 25)  earned += "focus_warrior"
    if (pomodoroCount >= 100) earned += "focus_legend"
    if (flashcardCount >= 50) earned += "card_collector"
    if (flashcardCount >= 500)earned += "card_master"

    val completed = quizSessions
        .filter { it.completed_at != null && it.score != null && it.total_questions != null }
        .sortedBy { it.completed_at }

    val hasAce = completed.any { (it.score!!.toFloat() / it.total_questions!!) * 100 >= 90 }
    if (hasAce) earned += "quiz_ace"

    var streak70 = 0
    for (q in completed) {
        val pct = (q.score!!.toFloat() / q.total_questions!!) * 100
        if (pct >= 70) { streak70++; if (streak70 >= 5) { earned += "quiz_streak"; break } }
        else streak70 = 0
    }

    val correctCount = quizQuestions.count { it.user_answer == it.correct_answer }
    if (correctCount >= 100) earned += "questions_100"

    val scoresByDoc = mutableMapOf<String, MutableList<Float>>()
    completed.forEach { q ->
        val key = q.document_name ?: q.id
        val pct = (q.score!!.toFloat() / q.total_questions!!) * 100
        scoresByDoc.getOrPut(key) { mutableListOf() }.add(pct)
    }
    val hasComeback = scoresByDoc.values.any { scores ->
        scores.size >= 2 && scores.any { it < 70 } && scores.last() >= 70
    }
    if (hasComeback) earned += "comeback_kid"

    if (streakDays >= 3)  earned += "streak_3"
    if (streakDays >= 7)  earned += "streak_7"
    if (streakDays >= 14) earned += "streak_14"
    if (streakDays >= 30) earned += "streak_30"
    if (documentCount >= 10) earned += "bookworm"

    return earned
}
