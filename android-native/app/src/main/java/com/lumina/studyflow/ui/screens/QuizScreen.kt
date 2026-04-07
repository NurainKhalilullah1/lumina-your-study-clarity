package com.lumina.studyflow.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lumina.studyflow.data.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.functions.functions
import io.github.jan.supabase.postgrest.from
import kotlinx.coroutines.launch
import io.ktor.client.call.body
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*

// ─── Models ───────────────────────────────────────────────────────────────────

data class QuizQuestion(
    val question: String,
    val options: List<String>,
    val correctAnswer: String,
    val explanation: String = ""
)

@Serializable private data class QzPart(val text: String)
@Serializable private data class QzContent(val role: String, val parts: List<QzPart>)
@Serializable private data class QzRequest(val contents: List<QzContent>)
@Serializable private data class QzResponse(val text: String)

enum class QuizPhase { SETUP, LOADING, ACTIVE, RESULTS }

// ─── Screen ───────────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuizScreen() {
    val coroutineScope      = rememberCoroutineScope()
    val snackbarHostState   = remember { SnackbarHostState() }

    var phase               by remember { mutableStateOf(QuizPhase.SETUP) }
    var topic               by remember { mutableStateOf("") }
    var numQuestions        by remember { mutableStateOf(5) }
    var questions           by remember { mutableStateOf<List<QuizQuestion>>(emptyList()) }
    var currentIndex        by remember { mutableStateOf(0) }
    var userAnswers         by remember { mutableStateOf<Map<Int, String>>(emptyMap()) }
    var selectedAnswer      by remember { mutableStateOf<String?>(null) }
    var showExplanation     by remember { mutableStateOf(false) }
    var sessionId           by remember { mutableStateOf<String?>(null) }

    // ── Helpers ────────────────────────────────────────────────────────────
    val score = userAnswers.entries.count { (idx, ans) ->
        questions.getOrNull(idx)?.correctAnswer == ans
    }

    fun generateQuiz() {
        if (topic.isBlank()) return
        phase = QuizPhase.LOADING
        coroutineScope.launch {
            try {
                val prompt = """Generate exactly $numQuestions multiple-choice quiz questions about: "$topic".
Return ONLY a valid JSON array, no markdown, no explanation, no code fences.
Each object must have: question (string), options (array of 4 strings), correct_answer (string matching one of the options exactly), explanation (string).
Format: [{"question":"...","options":["A","B","C","D"],"correct_answer":"A","explanation":"..."},...]"""

                val request = QzRequest(listOf(QzContent("user", listOf(QzPart(prompt)))))
                val rawText = SupabaseClient.client.functions
                    .invoke("gemini-chat") { body = request }
                    .body<QzResponse>().text.trim()
                    .removePrefix("```json").removePrefix("```")
                    .removeSuffix("```").trim()

                val arr = Json.parseToJsonElement(rawText).jsonArray
                questions = arr.map { el ->
                    val o = el.jsonObject
                    QuizQuestion(
                        question    = o["question"]?.jsonPrimitive?.content ?: "",
                        options     = o["options"]?.jsonArray?.map { it.jsonPrimitive.content } ?: emptyList(),
                        correctAnswer = o["correct_answer"]?.jsonPrimitive?.content ?: "",
                        explanation = o["explanation"]?.jsonPrimitive?.content ?: ""
                    )
                }
                currentIndex  = 0
                userAnswers   = emptyMap()
                selectedAnswer = null
                showExplanation = false

                // Create quiz session in DB
                try {
                    val userId = SupabaseClient.client.auth.currentUserOrNull()?.id
                    if (userId != null) {
                        val sess = SupabaseClient.client.from("quiz_sessions").insert(
                            mapOf(
                                "user_id"       to userId,
                                "document_name" to topic,
                                "num_questions" to numQuestions,
                                "started_at"    to java.util.Date(System.currentTimeMillis()).toInstant().toString()
                            )
                        ) { select() }.decodeSingleOrNull<Map<String, JsonElement>>()
                        sessionId = sess?.get("id")?.jsonPrimitive?.content
                    }
                } catch (_: Exception) {}

                phase = QuizPhase.ACTIVE
            } catch (e: Exception) {
                snackbarHostState.showSnackbar("Failed to generate quiz: ${e.localizedMessage}")
                phase = QuizPhase.SETUP
            }
        }
    }

    fun submitAnswer(answer: String) {
        if (selectedAnswer != null) return
        selectedAnswer = answer
        showExplanation = false
        userAnswers = userAnswers + (currentIndex to answer)
    }

    fun nextQuestion() {
        if (currentIndex < questions.size - 1) {
            currentIndex++
            selectedAnswer = null
            showExplanation = false
        } else {
            // Save results to DB
            coroutineScope.launch {
                try {
                    val sid = sessionId ?: return@launch
                    val userId = SupabaseClient.client.auth.currentUserOrNull()?.id ?: return@launch
                    // Upsert session completion
                    SupabaseClient.client.from("quiz_sessions").update(
                        mapOf("score" to score, "total_questions" to questions.size, "completed_at" to java.util.Date(System.currentTimeMillis()).toInstant().toString())
                    ) { filter { eq("id", sid) } }
                    // Insert each question answer
                    questions.forEachIndexed { idx, q ->
                        val userAns = userAnswers[idx]
                        SupabaseClient.client.from("quiz_questions").insert(
                            mapOf(
                                "quiz_session_id" to sid,
                                "question_number" to (idx + 1),
                                "question"        to q.question,
                                "options"         to Json.encodeToJsonElement(q.options),
                                "correct_answer"  to q.correctAnswer,
                                "user_answer"     to (userAns ?: ""),
                                "is_flagged"      to false
                            )
                        )
                    }
                    // Record study event
                    SupabaseClient.client.from("study_events").insert(
                        mapOf("user_id" to userId, "event_type" to "quiz_completed")
                    )
                } catch (_: Exception) {}
            }
            phase = QuizPhase.RESULTS
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        AnimatedContent(
            targetState = phase,
            transitionSpec = {
                fadeIn(tween(300)) togetherWith fadeOut(tween(200))
            },
            modifier = Modifier.fillMaxSize().padding(padding),
            label = "quizPhase"
        ) { currentPhase ->
            when (currentPhase) {
                QuizPhase.SETUP   -> QuizSetupView(topic, numQuestions, onTopicChange = { topic = it }, onCountChange = { numQuestions = it }, onStart = { generateQuiz() })
                QuizPhase.LOADING -> QuizLoadingView(numQuestions, topic)
                QuizPhase.ACTIVE  -> if (questions.isNotEmpty()) {
                    QuizActiveView(
                        questions       = questions,
                        currentIndex    = currentIndex,
                        selectedAnswer  = selectedAnswer,
                        showExplanation = showExplanation,
                        onAnswer        = { submitAnswer(it) },
                        onToggleExplain = { showExplanation = !showExplanation },
                        onNext          = { nextQuestion() }
                    )
                }
                QuizPhase.RESULTS -> QuizResultsView(
                    score    = score,
                    total    = questions.size,
                    questions = questions,
                    userAnswers = userAnswers,
                    onRetake  = { phase = QuizPhase.SETUP; topic = ""; questions = emptyList() },
                    onSameTopic = { generateQuiz() }
                )
            }
        }
    }
}

// ─── Setup View ───────────────────────────────────────────────────────────────
@Composable
private fun QuizSetupView(
    topic: String, numQuestions: Int,
    onTopicChange: (String) -> Unit, onCountChange: (Int) -> Unit, onStart: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(32.dp))
        Text("📝", fontSize = 56.sp)
        Spacer(modifier = Modifier.height(16.dp))
        Text("AI Quiz Generator", fontSize = 28.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
        Text("Test your knowledge on any topic", fontSize = 15.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)
        Spacer(modifier = Modifier.height(36.dp))

        Card(shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
            Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                OutlinedTextField(
                    value = topic, onValueChange = onTopicChange,
                    label = { Text("Quiz Topic *") },
                    placeholder = { Text("e.g. The French Revolution, Cell Biology…") },
                    modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), singleLine = true
                )
                Column {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Questions", fontWeight = FontWeight.Medium)
                        Text("$numQuestions", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    }
                    Slider(value = numQuestions.toFloat(), onValueChange = { onCountChange(it.toInt()) }, valueRange = 3f..15f, steps = 11)
                }
                // Difficulty chips row (cosmetic only — prompt handles difficulty via count)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("Quick (3)", "Standard (5-8)", "Deep (10+)").forEachIndexed { i, lbl ->
                        val match = i == 0 && numQuestions <= 4 || i == 1 && numQuestions in 5..9 || i == 2 && numQuestions >= 10
                        AssistChip(
                            onClick = { onCountChange(listOf(3, 6, 12)[i]) },
                            label = { Text(lbl, fontSize = 11.sp) },
                            colors = AssistChipDefaults.assistChipColors(
                                containerColor = if (match) MaterialTheme.colorScheme.primary.copy(0.12f) else Color.Transparent
                            )
                        )
                    }
                }
            }
        }
        Spacer(modifier = Modifier.height(24.dp))
        Button(
            onClick = onStart, enabled = topic.isNotBlank(),
            modifier = Modifier.fillMaxWidth().height(56.dp), shape = RoundedCornerShape(16.dp)
        ) {
            Icon(Icons.Filled.AutoAwesome, null, modifier = Modifier.size(20.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text("Generate Quiz ⚡", fontSize = 17.sp, fontWeight = FontWeight.Bold)
        }
    }
}

// ─── Loading View ─────────────────────────────────────────────────────────────
@Composable
private fun QuizLoadingView(count: Int, topic: String) {
    Column(modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
        CircularProgressIndicator(modifier = Modifier.size(56.dp), strokeWidth = 4.dp)
        Spacer(modifier = Modifier.height(20.dp))
        Text("Crafting $count questions…", fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
        Text("Topic: \"$topic\"", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

// ─── Active Quiz View ─────────────────────────────────────────────────────────
@Composable
private fun QuizActiveView(
    questions: List<QuizQuestion>,
    currentIndex: Int,
    selectedAnswer: String?,
    showExplanation: Boolean,
    onAnswer: (String) -> Unit,
    onToggleExplain: () -> Unit,
    onNext: () -> Unit
) {
    val q = questions[currentIndex]
    val progress = (currentIndex + 1).toFloat() / questions.size

    Column(modifier = Modifier.fillMaxSize().padding(20.dp)) {
        // Progress
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("Question ${currentIndex + 1}/${questions.size}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
            Text("${(progress * 100).toInt()}%", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold)
        }
        Spacer(modifier = Modifier.height(8.dp))
        LinearProgressIndicator(
            progress = { progress },
            modifier = Modifier.fillMaxWidth().height(6.dp).clip(CircleShape),
            color = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(24.dp))

        // Question card
        Card(shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface), elevation = CardDefaults.cardElevation(4.dp)) {
            Text(q.question, modifier = Modifier.padding(20.dp), fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurface)
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Options
        val letters = listOf("A", "B", "C", "D")
        q.options.forEachIndexed { i, option ->
            val isCorrect = selectedAnswer != null && option == q.correctAnswer
            val isWrong   = selectedAnswer == option && option != q.correctAnswer
            val isChosen  = selectedAnswer == option
            val containerColor = when {
                isCorrect -> Color(0xFF22C55E).copy(alpha = 0.15f)
                isWrong   -> MaterialTheme.colorScheme.errorContainer
                else      -> MaterialTheme.colorScheme.surface
            }
            val borderColor = when {
                isCorrect -> Color(0xFF22C55E)
                isWrong   -> MaterialTheme.colorScheme.error
                isChosen  -> MaterialTheme.colorScheme.primary
                else      -> MaterialTheme.colorScheme.outline.copy(0.3f)
            }

            Card(
                modifier = Modifier.fillMaxWidth().padding(vertical = 5.dp)
                    .border(1.5.dp, borderColor, RoundedCornerShape(14.dp))
                    .clickable(enabled = selectedAnswer == null) { onAnswer(option) },
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = containerColor),
                elevation = CardDefaults.cardElevation(if (selectedAnswer == null) 2.dp else 0.dp)
            ) {
                Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier.size(32.dp).clip(CircleShape)
                            .background(if (isCorrect) Color(0xFF22C55E) else if (isWrong) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.surfaceVariant),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            if (isCorrect) "✓" else if (isWrong) "✗" else letters.getOrElse(i) { "" },
                            fontSize = 14.sp, fontWeight = FontWeight.Bold,
                            color = if (isCorrect || isWrong) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(option, fontSize = 15.sp, color = MaterialTheme.colorScheme.onSurface, modifier = Modifier.weight(1f))
                }
            }
        }

        // Explanation
        if (selectedAnswer != null && q.explanation.isNotEmpty()) {
            Spacer(modifier = Modifier.height(12.dp))
            TextButton(onClick = onToggleExplain) {
                Icon(if (showExplanation) Icons.Filled.ExpandLess else Icons.Filled.ExpandMore, null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text(if (showExplanation) "Hide explanation" else "Show explanation")
            }
            AnimatedVisibility(visible = showExplanation) {
                Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(0.4f))) {
                    Row(modifier = Modifier.padding(14.dp)) {
                        Text("💡", fontSize = 16.sp)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(q.explanation, fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurface, lineHeight = 20.sp)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.weight(1f))

        if (selectedAnswer != null) {
            Button(
                onClick = onNext,
                modifier = Modifier.fillMaxWidth().height(54.dp),
                shape = RoundedCornerShape(16.dp)
            ) {
                Text(
                    if (currentIndex < questions.size - 1) "Next Question →" else "View Results 🎉",
                    fontSize = 16.sp, fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

// ─── Results View ─────────────────────────────────────────────────────────────
@Composable
private fun QuizResultsView(
    score: Int, total: Int,
    questions: List<QuizQuestion>,
    userAnswers: Map<Int, String>,
    onRetake: () -> Unit,
    onSameTopic: () -> Unit
) {
    val pct = if (total > 0) (score.toFloat() / total * 100).toInt() else 0
    val (emoji, msg) = when {
        pct >= 90 -> "🏆" to "Excellent work!"
        pct >= 70 -> "🎉" to "Great job!"
        pct >= 50 -> "📚" to "Keep studying!"
        else      -> "💪" to "Don't give up!"
    }
    val scoreColor = when {
        pct >= 70 -> Color(0xFF22C55E)
        pct >= 50 -> Color(0xFFF59E0B)
        else      -> MaterialTheme.colorScheme.error
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Score card
        item {
            Card(shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Column(modifier = Modifier.fillMaxWidth().padding(28.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(emoji, fontSize = 52.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Quiz Complete!", fontSize = 22.sp, fontWeight = FontWeight.Bold)
                    Text(msg, fontSize = 15.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.height(20.dp))
                    Text("$score / $total", fontSize = 52.sp, fontWeight = FontWeight.ExtraBold, color = scoreColor)
                    Text("$pct% correct", fontSize = 16.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.height(16.dp))
                    LinearProgressIndicator(
                        progress = { pct / 100f },
                        modifier = Modifier.fillMaxWidth().height(10.dp).clip(CircleShape),
                        color = scoreColor,
                        trackColor = scoreColor.copy(0.15f)
                    )
                }
            }
        }

        // Action buttons
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedButton(onClick = onRetake, modifier = Modifier.weight(1f).height(50.dp)) {
                    Text("New Quiz")
                }
                Button(onClick = onSameTopic, modifier = Modifier.weight(1f).height(50.dp)) {
                    Icon(Icons.Filled.Refresh, null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Retry")
                }
            }
        }

        // Answer review
        item { Text("Answer Review", fontSize = 18.sp, fontWeight = FontWeight.Bold) }
        items(questions.size) { idx ->
            val q = questions[idx]
            val userAns = userAnswers[idx]
            val correct = userAns == q.correctAnswer
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (correct) Color(0xFF22C55E).copy(0.08f) else MaterialTheme.colorScheme.errorContainer.copy(0.3f)
                )
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(verticalAlignment = Alignment.Top) {
                        Text(if (correct) "✅" else "❌", fontSize = 16.sp)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(q.question, fontWeight = FontWeight.Medium, fontSize = 14.sp, modifier = Modifier.weight(1f))
                    }
                    if (!correct && userAns != null) {
                        Text("Your answer: $userAns", fontSize = 13.sp, color = MaterialTheme.colorScheme.error)
                    }
                    Text("Correct: ${q.correctAnswer}", fontSize = 13.sp, color = Color(0xFF22C55E), fontWeight = FontWeight.SemiBold)
                    if (q.explanation.isNotEmpty()) {
                        Text("💡 ${q.explanation}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, lineHeight = 18.sp)
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(32.dp)) }
    }
}
