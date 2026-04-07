package com.lumina.studyflow.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.Remove
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
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.from
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable

@Serializable
data class LeaderboardEntry(
    val user_id: String,
    val name: String,
    val weekly_xp: Int = 0,
    val level: Int = 1,
    val avatar_url: String? = null,
    val current_league: Int = 1
)

@Composable
fun LeaderboardScreen() {
    var entries by remember { mutableStateOf<List<LeaderboardEntry>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var currentUserId by remember { mutableStateOf<String?>(null) }
    val coroutineScope = rememberCoroutineScope()

    // Countdown state (weekly reset)
    var countdown by remember { mutableStateOf("Calculating...") }

    LaunchedEffect(Unit) {
        currentUserId = SupabaseClient.client.auth.currentUserOrNull()?.id

        // Calculate countdown to end of week (Sunday midnight)
        val now = System.currentTimeMillis()
        val cal = java.util.Calendar.getInstance()
        cal.set(java.util.Calendar.DAY_OF_WEEK, java.util.Calendar.SUNDAY)
        cal.add(java.util.Calendar.WEEK_OF_YEAR, 1)
        cal.set(java.util.Calendar.HOUR_OF_DAY, 0)
        cal.set(java.util.Calendar.MINUTE, 0)
        val diff = cal.timeInMillis - now
        val d = (diff / 86400000).toInt()
        val h = ((diff % 86400000) / 3600000).toInt()
        val m = ((diff % 3600000) / 60000).toInt()
        countdown = "${d}d ${h}h ${m}m"

        try {
            // ── Step 1: Fetch user's current league (default 1 if not found) ──
            val userLeague = try {
                currentUserId?.let { uid ->
                    @Serializable data class XpRow(val current_league: Int = 1)
                    SupabaseClient.client.from("user_xp")
                        .select { filter { eq("user_id", uid) } }
                        .decodeSingleOrNull<XpRow>()?.current_league ?: 1
                } ?: 1
            } catch (_: Exception) { 1 }

            // ── Step 2: Fetch leaderboard for that league ─────────────────
            val result = SupabaseClient.client.postgrest.rpc(
                function = "get_league_leaderboard",
                parameters = mapOf("p_league" to userLeague)
            ).decodeList<LeaderboardEntry>()
            entries = result
        } catch (e: Exception) {
            // fallback: empty list
        } finally {
            isLoading = false
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Header
        Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Filled.EmojiEvents, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(28.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Leaderboard", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
                Spacer(modifier = Modifier.weight(1f))
                Text("Resets in $countdown", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Zone legend
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.KeyboardArrowUp, null, tint = Color(0xFF22C55E), modifier = Modifier.size(16.dp))
                    Text("Top 5: Promoted", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.Remove, null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(16.dp))
                    Text("Stay", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.KeyboardArrowDown, null, tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(16.dp))
                    Text("16+: Relegated", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (entries.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Filled.EmojiEvents, null, modifier = Modifier.size(64.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("No learners yet. Be the first!", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        } else {
            // Table header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surfaceVariant)
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("#", fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.width(32.dp), color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text("Student", fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.weight(1f), color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text("Level", fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.width(50.dp), color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text("XP", fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.width(60.dp), color = MaterialTheme.colorScheme.onSurfaceVariant)
            }

            LazyColumn {
                itemsIndexed(entries) { index, entry ->
                    val rank = index + 1
                    val isCurrentUser = entry.user_id == currentUserId
                    val rowBg = when {
                        isCurrentUser -> MaterialTheme.colorScheme.primary.copy(alpha = 0.05f)
                        rank <= 5 -> Color(0xFF22C55E).copy(alpha = 0.05f)
                        rank > 15 -> MaterialTheme.colorScheme.error.copy(alpha = 0.05f)
                        else -> Color.Transparent
                    }
                    val zoneIcon = when {
                        rank <= 5 -> Icons.Filled.KeyboardArrowUp to Color(0xFF22C55E)
                        rank > 15 -> Icons.Filled.KeyboardArrowDown to MaterialTheme.colorScheme.error
                        else -> Icons.Filled.Remove to MaterialTheme.colorScheme.onSurfaceVariant
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(rowBg)
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Rank / medal
                        Box(modifier = Modifier.width(32.dp)) {
                            when (rank) {
                                1 -> Text("🥇", fontSize = 18.sp)
                                2 -> Text("🥈", fontSize = 18.sp)
                                3 -> Text("🥉", fontSize = 18.sp)
                                else -> Text("$rank", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 14.sp)
                            }
                        }

                        // Avatar + Name
                        Row(modifier = Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    entry.name.first().uppercaseChar().toString(),
                                    color = MaterialTheme.colorScheme.primary,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Column {
                                Text(
                                    buildString {
                                        append(entry.name)
                                        if (isCurrentUser) append(" (You)")
                                    },
                                    fontWeight = if (isCurrentUser) FontWeight.Bold else FontWeight.Normal,
                                    fontSize = 14.sp,
                                    color = if (isCurrentUser) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
                                )
                                Icon(zoneIcon.first, null, tint = zoneIcon.second, modifier = Modifier.size(14.dp))
                            }
                        }

                        // Level badge
                        Box(
                            modifier = Modifier
                                .width(50.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f))
                                .padding(horizontal = 4.dp, vertical = 2.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("Lv.${entry.level}", fontSize = 11.sp, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                        }

                        Spacer(modifier = Modifier.width(8.dp))

                        // Weekly XP
                        Text(
                            "${entry.weekly_xp.coerceAtLeast(0)}",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.width(60.dp),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                    HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)
                }
            }
        }
    }
}
