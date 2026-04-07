package com.lumina.studyflow.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lumina.studyflow.data.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Order
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import java.text.SimpleDateFormat
import java.util.*

@Serializable
data class QuizSessionHistory(
    val id: String = "",
    val user_id: String = "",
    val document_name: String? = null,
    val score: Int? = null,
    val total_questions: Int? = null,
    val completed_at: String? = null,
    val created_at: String = ""
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuizHistoryScreen() {
    var sessions by remember { mutableStateOf<List<QuizSessionHistory>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    val coroutineScope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(Unit) {
        coroutineScope.launch {
            isLoading = true
            try {
                val userId = SupabaseClient.client.auth.currentUserOrNull()?.id ?: return@launch
                // Request all sessions for user, sorted by newest first
                // We filter out incomplete ones (no completed_at) in Kotlin since
                // postgrest-kt notNull() may not be available in all versions
                val all = SupabaseClient.client.from("quiz_sessions")
                    .select {
                        filter { eq("user_id", userId) }
                        order("created_at", Order.DESCENDING)
                    }
                    .decodeList<QuizSessionHistory>()
                // Only show completed sessions
                sessions = all.filter { it.completed_at != null }
            } catch (e: Exception) {
                snackbarHostState.showSnackbar("Failed to load history")
            } finally {
                isLoading = false
            }
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
                Text("Quiz History", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
                Text("Review your past quiz performances.", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }

            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (sessions.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("📊", fontSize = 48.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("No history yet", fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onBackground)
                        Text("Take a quiz to see your history", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(sessions, key = { it.id }) { session ->
                        QuizHistoryCard(session = session)
                    }
                }
            }
        }
    }
}

@Composable
fun QuizHistoryCard(session: QuizSessionHistory) {
    val total = session.total_questions ?: 1
    val score = session.score ?: 0
    val pct = (score.toFloat() / total * 100).toInt()

    val scoreColor = when {
        pct >= 70 -> Color(0xFF22C55E)
        pct >= 50 -> Color(0xFFF59E0B)
        else      -> MaterialTheme.colorScheme.error
    }

    // Use SimpleDateFormat (no java.time) for broad Android compatibility
    val dateStr = try {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val d = sdf.parse(session.created_at.take(10))
        SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(d!!)
    } catch (_: Exception) {
        session.created_at.take(10).ifBlank { "Unknown Date" }
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp).fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier.size(56.dp).clip(CircleShape).background(scoreColor.copy(0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Text("$pct%", fontWeight = FontWeight.Bold, color = scoreColor)
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(session.document_name ?: "General Quiz", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MaterialTheme.colorScheme.onSurface)
                Text(dateStr, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Column(horizontalAlignment = Alignment.End) {
                Text("$score / $total", fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurface)
                Text("Correct", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}
