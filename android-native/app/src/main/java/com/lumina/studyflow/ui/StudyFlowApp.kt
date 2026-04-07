package com.lumina.studyflow.ui

import android.content.Context
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.lumina.studyflow.ui.screens.*

sealed class BottomNavItem(val route: String, val label: String, val icon: ImageVector) {
    object Home       : BottomNavItem("dashboard",   "Home",        Icons.Filled.Home)
    object Community  : BottomNavItem("community",   "Community",   Icons.Filled.People)
    object Tutor      : BottomNavItem("tutor",       "AI Tutor",    Icons.Filled.Psychology)
    object Leaderboard: BottomNavItem("leaderboard", "Leaderboard", Icons.Filled.EmojiEvents)
    object Settings   : BottomNavItem("settings",    "Settings",    Icons.Filled.Settings)
}

private val bottomNavItems = listOf(
    BottomNavItem.Home,
    BottomNavItem.Community,
    BottomNavItem.Tutor,
    BottomNavItem.Leaderboard,
    BottomNavItem.Settings
)

// Routes where the bottom nav bar is hidden
private val hiddenNavRoutes = setOf(
    "splash", "intro", "auth", "onboarding",
    "flashcards", "quiz", "pomodoro", "assignments", "flashcard_decks",
    "quiz_history", "courses", "documents"
)

// ─── First-Run Detection ──────────────────────────────────────────────────────
private fun isFirstRun(context: Context): Boolean {
    val prefs = context.getSharedPreferences("lumina_prefs", Context.MODE_PRIVATE)
    return prefs.getBoolean("is_first_run", true)
}

private fun markFirstRunComplete(context: Context) {
    context.getSharedPreferences("lumina_prefs", Context.MODE_PRIVATE)
        .edit().putBoolean("is_first_run", false).apply()
}

// ─── App ─────────────────────────────────────────────────────────────────────

@Composable
fun StudyFlowApp() {
    val context       = LocalContext.current
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute  = navBackStackEntry?.destination?.route

    val showBottomBar = currentRoute !in hiddenNavRoutes

    // Decide start destination: intro (first-time) or splash (returning)
    val startDest = remember {
        if (isFirstRun(context)) "intro" else "splash"
    }

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar {
                    bottomNavItems.forEach { item ->
                        val selected = navBackStackEntry?.destination?.hierarchy
                            ?.any { it.route == item.route } == true
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                navController.navigate(item.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState    = true
                                }
                            },
                            icon  = { Icon(item.icon, contentDescription = item.label) },
                            label = { Text(item.label) }
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController    = navController,
            startDestination = startDest,
            modifier         = Modifier.padding(innerPadding)
        ) {
            // ── Intro (first-run only) ───────────────────────────────────
            composable("intro") {
                IntroScreen(
                    onGetStarted = {
                        markFirstRunComplete(context)
                        navController.navigate("auth") {
                            popUpTo("intro") { inclusive = true }
                        }
                    },
                    onSignIn = {
                        markFirstRunComplete(context)
                        navController.navigate("auth") {
                            popUpTo("intro") { inclusive = true }
                        }
                    }
                )
            }

            // ── Animated Splash (returning users) ────────────────────────
            composable("splash") {
                SplashScreen(onNavigateToAuth = {
                    navController.navigate("auth") {
                        popUpTo("splash") { inclusive = true }
                    }
                })
            }

            // ── Auth ─────────────────────────────────────────────────────
            composable("auth") {
                AuthScreen(onAuthSuccess = {
                    navController.navigate("onboarding") {
                        popUpTo("auth") { inclusive = true }
                    }
                })
            }

            // ── Onboarding (profile setup) ───────────────────────────────
            composable("onboarding") {
                OnboardingScreen(onComplete = {
                    navController.navigate("dashboard") {
                        popUpTo("onboarding") { inclusive = true }
                    }
                })
            }

            // ── Main Tabs ────────────────────────────────────────────────
            composable("dashboard") {
                DashboardScreen(
                    onNavigateToTutor      = { navController.navigate("tutor") },
                    onNavigateToFlashcards = { navController.navigate("flashcard_decks") },
                    onNavigateToQuiz       = { navController.navigate("quiz") },
                    onNavigateToPomodoro   = { navController.navigate("pomodoro") },
                    onNavigateToQuizHistory = { navController.navigate("quiz_history") },
                    onNavigateToCourses    = { navController.navigate("courses") },
                    onNavigateToDocuments  = { navController.navigate("documents") }
                )
            }
            composable("community")   { CommunityScreen() }
            composable("tutor")       { TutorScreen() }
            composable("leaderboard") { LeaderboardScreen() }
            composable("settings") {
                SettingsScreen(
                    onSignOut = {
                        navController.navigate("auth") {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }

            // ── Sub-screens ──────────────────────────────────────────────
            composable("pomodoro")      { PomodoroScreen() }
            composable("assignments")   { AssignmentsScreen() }
            composable("flashcard_decks") {
                FlashcardDecksScreen(onNavigateToGenerator = { navController.navigate("flashcards") })
            }
            composable("flashcards")    { FlashcardGeneratorScreen() }
            composable("quiz")          { QuizScreen() }
            composable("quiz_history")  { QuizHistoryScreen() }
            composable("courses")       { CoursesScreen() }
            composable("documents")     { DocumentsScreen() }
        }
    }
}
