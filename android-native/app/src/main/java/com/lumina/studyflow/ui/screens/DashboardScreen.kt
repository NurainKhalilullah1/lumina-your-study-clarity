package com.lumina.studyflow.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lumina.studyflow.core.*
import com.lumina.studyflow.data.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Order
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import java.util.*

// ─── Data models ──────────────────────────────────────────────────────────────
@Serializable
data class AssignmentItem(
    val id: String = "",
    val title: String = "",
    val due_date: String = "",
    val status: String = "pending",
    val course_name: String? = null,
    val type: String = "assignment"
)

@Serializable
data class UserXPRow(
    val total_xp: Int = 0,
    val level: Int = 1,
    val weekly_xp: Int = 0,
    val current_league: Int = 1,
    val achievements: List<Map<String, String>> = emptyList()
)

// ─── Screen ───────────────────────────────────────────────────────────────────
@Composable
fun DashboardScreen(
    onNavigateToTutor: () -> Unit = {},
    onNavigateToFlashcards: () -> Unit = {},
    onNavigateToQuiz: () -> Unit = {},
    onNavigateToPomodoro: () -> Unit = {},
    onNavigateToQuizHistory: () -> Unit = {},
    onNavigateToCourses: () -> Unit = {},
    onNavigateToDocuments: () -> Unit = {}
) {
    val coroutineScope = rememberCoroutineScope()

    var displayName by remember { mutableStateOf("Student") }
    var userXP by remember { mutableStateOf<UserXPRow?>(null) }
    var pendingCount by remember { mutableStateOf(0) }
    var examCount by remember { mutableStateOf(0) }
    var completedCount by remember { mutableStateOf(0) }
    var urgentAssignments by remember { mutableStateOf<List<AssignmentItem>>(emptyList()) }
    var studyStreak by remember { mutableStateOf(0) }
    var isLoading by remember { mutableStateOf(true) }

    val greeting = remember {
        val h = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        when { h < 12 -> "Good morning"; h < 17 -> "Good afternoon"; else -> "Good evening" }
    }

    LaunchedEffect(Unit) {
        try {
            val user = SupabaseClient.client.auth.currentUserOrNull() ?: return@LaunchedEffect
            val userId = user.id
            displayName = user.userMetadata?.get("full_name")?.toString()?.trim('"')
                ?: user.email?.substringBefore('@') ?: "Student"

            // Fetch user XP
            userXP = SupabaseClient.client.from("user_xp")
                .select { filter { eq("user_id", userId) } }
                .decodeSingleOrNull<UserXPRow>()

            // Assignment counts
            val allAssignments = SupabaseClient.client.from("assignments")
                .select { filter { eq("user_id", userId) } }
                .decodeList<AssignmentItem>()

            pendingCount   = allAssignments.count { it.status == "pending" && it.type == "assignment" }
            examCount      = allAssignments.count { it.status == "pending" && it.type == "exam" }
            completedCount = allAssignments.count { it.status == "completed" }

            // Urgent (due within 3 days)
            val now = Calendar.getInstance()
            val threeDays = Calendar.getInstance().also { it.add(Calendar.DAY_OF_YEAR, 3) }
            urgentAssignments = allAssignments
                .filter { it.status == "pending" && it.due_date.isNotEmpty() }
                .sortedBy { it.due_date }
                .take(3)

            // Study streak from study_events
            val events = SupabaseClient.client.from("study_events")
                .select { filter { eq("user_id", userId) } }
                .decodeList<StudyEventRow>()
            studyStreak = calculateStreakFromRows(events)
        } catch (_: Exception) {
        } finally {
            isLoading = false
        }
    }

    val levelInfo = getLevelFromXP(userXP?.total_xp ?: 0)
    val leagueName = getLeagueName(userXP?.current_league ?: 1)

    Scaffold(
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onNavigateToTutor,
                icon = { Icon(Icons.Filled.Psychology, null) },
                text = { Text("Ask AI Tutor", fontWeight = FontWeight.Bold) },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        if (isLoading) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            return@Scaffold
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(bottom = 80.dp)
        ) {
            // ── Header ──────────────────────────────────────────────────────────
            item {
                Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 20.dp)) {
                    Text("$greeting, $displayName 👋", fontSize = 26.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
                    Text("Here is your academic overview.", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            // ── Streak Banner ────────────────────────────────────────────────
            if (studyStreak > 0) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp).padding(bottom = 16.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF7ED))
                    ) {
                        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text("🔥", fontSize = 28.sp)
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text("$studyStreak Day Streak!", fontWeight = FontWeight.Bold, color = Color(0xFFEA580C))
                                Text("Keep it up — you're on a roll!", fontSize = 12.sp, color = Color(0xFFF97316))
                            }
                        }
                    }
                }
            }

            // ── XP Progress Card ─────────────────────────────────────────────
            item {
                XPProgressCard(
                    levelInfo = levelInfo,
                    weeklyXP = userXP?.weekly_xp ?: 0,
                    leagueName = leagueName,
                    modifier = Modifier.padding(horizontal = 20.dp).padding(bottom = 16.dp)
                )
            }

            // ── Assignment Stat Chips ────────────────────────────────────────
            item {
                Row(
                    modifier = Modifier.padding(horizontal = 20.dp).padding(bottom = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    StatChip(Modifier.weight(1f), "📋", pendingCount.toString(), "Pending", MaterialTheme.colorScheme.primary)
                    StatChip(Modifier.weight(1f), "📅", examCount.toString(), "Exams", Color(0xFFF97316))
                    StatChip(Modifier.weight(1f), "✅", completedCount.toString(), "Done", Color(0xFF22C55E))
                    StatChip(Modifier.weight(1f), "🔥", studyStreak.toString(), "Streak", Color(0xFFEA580C))
                }
            }

            // ── Quick Actions ────────────────────────────────────────────────
            item {
                DashboardSectionTitle("Quick Actions", modifier = Modifier.padding(horizontal = 20.dp))
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    val actions = listOf(
                        Triple("🃏", "Flashcards", onNavigateToFlashcards),
                        Triple("📝", "Take a Quiz", onNavigateToQuiz),
                        Triple("🍅", "Pomodoro", onNavigateToPomodoro),
                        Triple("🤖", "AI Tutor", onNavigateToTutor),
                        Triple("📖", "Courses", onNavigateToCourses),
                        Triple("📊", "Quiz History", onNavigateToQuizHistory),
                        Triple("📄", "Documents", onNavigateToDocuments)
                    )
                    items(actions) { (icon, label, action) ->
                        QuickActionCard(icon = icon, label = label, onClick = action)
                    }
                }
            }

            // ── Achievements ─────────────────────────────────────────────────
            item {
                AchievementsCard(
                    earnedIds = userXP?.achievements?.mapNotNull { it["id"] } ?: emptyList(),
                    modifier = Modifier.padding(horizontal = 20.dp).padding(vertical = 8.dp)
                )
            }

            // ── Due Soon ─────────────────────────────────────────────────────
            item {
                DueSoonCard(
                    assignments = urgentAssignments,
                    modifier = Modifier.padding(horizontal = 20.dp).padding(vertical = 8.dp)
                )
            }
        }
    }
}

// ─── XP Progress Card ─────────────────────────────────────────────────────────
@Composable
fun XPProgressCard(
    levelInfo: LevelInfo,
    weeklyXP: Int,
    leagueName: String,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.08f))
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column {
                    Text("Level ${levelInfo.level}", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = MaterialTheme.colorScheme.primary)
                    Text(levelInfo.title, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(leagueName, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.primary)
                    Text("${levelInfo.currentXP} XP total", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
            LinearProgressIndicator(
                progress = { levelInfo.progress },
                modifier = Modifier.fillMaxWidth().height(8.dp).clip(CircleShape),
                color = MaterialTheme.colorScheme.primary,
                trackColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("${levelInfo.currentXP - levelInfo.xpForCurrentLevel} / ${levelInfo.xpForNextLevel - levelInfo.xpForCurrentLevel} XP", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text("⚡ $weeklyXP XP this week", fontSize = 11.sp, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

// ─── Achievements Card ────────────────────────────────────────────────────────
@Composable
fun AchievementsCard(earnedIds: List<String>, modifier: Modifier = Modifier) {
    Card(modifier = modifier.fillMaxWidth(), shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Column(modifier = Modifier.padding(18.dp)) {
            Text("Achievements", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = MaterialTheme.colorScheme.onSurface)
            Text("${earnedIds.size} / ${ACHIEVEMENTS.size} unlocked", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(modifier = Modifier.height(14.dp))
            val rows = ACHIEVEMENTS.chunked(5)
            rows.forEach { row ->
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    row.forEach { a ->
                        val earned = a.id in earnedIds
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (earned) MaterialTheme.colorScheme.primary.copy(0.12f) else MaterialTheme.colorScheme.surfaceVariant),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                a.icon,
                                fontSize = 22.sp,
                                color = if (earned) Color.Unspecified else Color.Gray.copy(0.3f)
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
            }
        }
    }
}

// ─── Due Soon Card ────────────────────────────────────────────────────────────
@Composable
fun DueSoonCard(assignments: List<AssignmentItem>, modifier: Modifier = Modifier) {
    Card(modifier = modifier.fillMaxWidth(), shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Filled.Warning, null, tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Due Soon", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = MaterialTheme.colorScheme.onSurface)
            }
            Spacer(modifier = Modifier.height(12.dp))
            if (assignments.isEmpty()) {
                Box(modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("✨", fontSize = 36.sp)
                        Text("No urgent deadlines!", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            } else {
                assignments.forEach { a ->
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(a.title, fontWeight = FontWeight.Medium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            if (a.course_name != null) Text(a.course_name, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        if (a.type == "exam") {
                            Badge(containerColor = Color(0xFFF97316).copy(0.15f)) { Text("EXAM", color = Color(0xFFF97316), fontSize = 10.sp) }
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            formatDueDate(a.due_date),
                            color = MaterialTheme.colorScheme.error,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(MaterialTheme.colorScheme.error.copy(0.1f)).padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }
            }
        }
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
@Composable
private fun StatChip(modifier: Modifier, icon: String, value: String, label: String, color: Color) {
    Card(modifier = modifier, shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = color.copy(0.1f))) {
        Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(icon, fontSize = 20.sp)
            Text(value, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = color)
            Text(label, fontSize = 10.sp, color = color.copy(0.8f))
        }
    }
}

@Composable
private fun QuickActionCard(icon: String, label: String, onClick: () -> Unit) {
    Card(
        modifier = Modifier.size(90.dp).clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            Text(icon, fontSize = 28.sp)
            Spacer(modifier = Modifier.height(4.dp))
            Text(label, fontSize = 11.sp, fontWeight = FontWeight.Medium, color = MaterialTheme.colorScheme.onSurface, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

@Composable
private fun DashboardSectionTitle(title: String, modifier: Modifier = Modifier) {
    Text(title, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground, modifier = modifier.padding(bottom = 4.dp))
}

private fun formatDueDate(dateStr: String): String {
    return try {
        val sdf = java.text.SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val date = sdf.parse(dateStr.take(10)) ?: return dateStr.take(10)
        val display = java.text.SimpleDateFormat("MMM d", Locale.getDefault())
        display.format(date)
    } catch (_: Exception) { dateStr.take(10) }
}

@Serializable
private data class StudyEventRow(val event_type: String = "", val created_at: String = "")

private fun calculateStreakFromRows(events: List<StudyEventRow>): Int {
    if (events.isEmpty()) return 0
    val days = events.mapNotNull { it.created_at.take(10).takeIf { it.length == 10 } }.toSortedSet()
    val fmt = java.text.SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    var streak = 0
    val cal = Calendar.getInstance()
    var dayStr = fmt.format(cal.time)
    if (dayStr !in days) { cal.add(Calendar.DATE, -1); dayStr = fmt.format(cal.time) }
    while (dayStr in days) {
        streak++
        cal.add(Calendar.DATE, -1)
        dayStr = fmt.format(cal.time)
    }
    return streak
}
