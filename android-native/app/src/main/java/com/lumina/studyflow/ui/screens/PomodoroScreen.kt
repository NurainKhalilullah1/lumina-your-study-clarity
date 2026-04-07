package com.lumina.studyflow.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Coffee
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lumina.studyflow.data.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.from
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

enum class TimerMode(val label: String, val durationSeconds: Int, val icon: String) {
    WORK       ("Focus",       25 * 60, "📖"),
    SHORT_BREAK("Short Break",  5 * 60, "☕"),
    LONG_BREAK ("Long Break",  15 * 60, "🌙")
}

@Composable
fun PomodoroScreen() {
    var mode by remember { mutableStateOf(TimerMode.WORK) }
    var secondsLeft by remember { mutableStateOf(mode.durationSeconds) }
    var isRunning by remember { mutableStateOf(false) }
    var completedSessions by remember { mutableStateOf(0) }
    val coroutineScope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    // Color per mode
    val modeColor = when (mode) {
        TimerMode.WORK        -> MaterialTheme.colorScheme.primary
        TimerMode.SHORT_BREAK -> Color(0xFF22C55E)
        TimerMode.LONG_BREAK  -> Color(0xFF3B82F6)
    }

    // Countdown tick
    LaunchedEffect(isRunning, mode) {
        if (isRunning) {
            while (secondsLeft > 0 && isRunning) {
                delay(1000L)
                secondsLeft--
            }
            if (secondsLeft == 0) {
                isRunning = false
                if (mode == TimerMode.WORK) {
                    completedSessions++
                    // Record XP event to Supabase
                    coroutineScope.launch {
                        try {
                            val userId = SupabaseClient.client.auth.currentUserOrNull()?.id ?: return@launch
                            SupabaseClient.client.from("study_events").insert(
                                buildJsonObject {
                                    put("user_id", userId)
                                    put("event_type", "pomodoro_completed")
                                }
                            )
                        } catch (_: Exception) {}
                    }
                    snackbarHostState.showSnackbar("🎉 Session complete! +25 XP")
                    // Auto-switch to break
                    mode = if (completedSessions % 4 == 0) TimerMode.LONG_BREAK else TimerMode.SHORT_BREAK
                } else {
                    snackbarHostState.showSnackbar("Break over! Time to focus.")
                    mode = TimerMode.WORK
                }
                secondsLeft = mode.durationSeconds
            }
        }
    }

    val progress = secondsLeft.toFloat() / mode.durationSeconds.toFloat()
    val minutes = secondsLeft / 60
    val seconds = secondsLeft % 60

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("Pomodoro Timer", fontSize = 26.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
            Spacer(modifier = Modifier.height(8.dp))
            Text("${completedSessions} sessions completed today", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)

            Spacer(modifier = Modifier.height(32.dp))

            // Mode tabs
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TimerMode.entries.forEach { m ->
                    FilterChip(
                        selected = mode == m,
                        onClick = {
                            mode = m
                            secondsLeft = m.durationSeconds
                            isRunning = false
                        },
                        label = { Text(m.label, fontSize = 12.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = modeColor.copy(alpha = 0.15f),
                            selectedLabelColor = modeColor
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(48.dp))

            // Circular Progress Ring
            Box(contentAlignment = Alignment.Center, modifier = Modifier.size(260.dp)) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val strokeWidth = 18.dp.toPx()
                    val arcSize = size.minDimension - strokeWidth
                    val topLeft = Offset(strokeWidth / 2f, strokeWidth / 2f)

                    // Track ring
                    drawArc(
                        color = modeColor.copy(alpha = 0.12f),
                        startAngle = -90f,
                        sweepAngle = 360f,
                        useCenter = false,
                        topLeft = topLeft,
                        size = Size(arcSize, arcSize),
                        style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                    )
                    // Progress ring
                    drawArc(
                        color = modeColor,
                        startAngle = -90f,
                        sweepAngle = 360f * progress,
                        useCenter = false,
                        topLeft = topLeft,
                        size = Size(arcSize, arcSize),
                        style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                    )
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(mode.icon, fontSize = 32.sp)
                    Text(
                        text = "%02d:%02d".format(minutes, seconds),
                        fontSize = 52.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Text(mode.label, fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            Spacer(modifier = Modifier.height(48.dp))

            // Controls
            Row(
                horizontalArrangement = Arrangement.spacedBy(24.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Reset
                FilledTonalIconButton(
                    onClick = { secondsLeft = mode.durationSeconds; isRunning = false },
                    modifier = Modifier.size(52.dp)
                ) {
                    Icon(Icons.Filled.Refresh, contentDescription = "Reset")
                }

                // Play / Pause
                Button(
                    onClick = { isRunning = !isRunning },
                    modifier = Modifier.size(72.dp).clip(CircleShape),
                    contentPadding = PaddingValues(0.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = modeColor)
                ) {
                    Icon(
                        if (isRunning) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                        contentDescription = null,
                        modifier = Modifier.size(36.dp),
                        tint = Color.White
                    )
                }

                // Skip
                FilledTonalIconButton(
                    onClick = {
                        isRunning = false
                        mode = when (mode) {
                            TimerMode.WORK -> TimerMode.SHORT_BREAK
                            else -> TimerMode.WORK
                        }
                        secondsLeft = mode.durationSeconds
                    },
                    modifier = Modifier.size(52.dp)
                ) {
                    Icon(Icons.Filled.SkipNext, contentDescription = "Skip")
                }
            }

            Spacer(modifier = Modifier.height(48.dp))

            // Session dots
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Session Progress", fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurface)
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        repeat(4) { index ->
                            Box(
                                modifier = Modifier
                                    .size(14.dp)
                                    .background(
                                        if (index < completedSessions % 4) MaterialTheme.colorScheme.primary
                                        else MaterialTheme.colorScheme.surfaceVariant,
                                        CircleShape
                                    )
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "${completedSessions % 4}/4 sessions until long break",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // XP info
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("🍅", fontSize = 16.sp)
                Spacer(modifier = Modifier.width(4.dp))
                Text("25 min focus", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(modifier = Modifier.width(16.dp))
                Text("☕", fontSize = 16.sp)
                Spacer(modifier = Modifier.width(4.dp))
                Text("5 min break", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(modifier = Modifier.width(16.dp))
                Text("⚡", fontSize = 16.sp)
                Spacer(modifier = Modifier.width(4.dp))
                Text("+25 XP/session", fontSize = 13.sp, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}
