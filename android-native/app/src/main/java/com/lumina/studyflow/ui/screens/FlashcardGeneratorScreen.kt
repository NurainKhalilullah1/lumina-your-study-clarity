package com.lumina.studyflow.ui.screens

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lumina.studyflow.data.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.functions.functions
import io.github.jan.supabase.postgrest.from
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*

// ─── Models ───────────────────────────────────────────────────────────────────

@Serializable
data class GeneratedCard(val front: String, val back: String)

@Serializable
data class FlashcardItem(val question: String, val answer: String)

// Reuse AI request types from TutorViewModel
@Serializable private data class FcPart(val text: String)
@Serializable private data class FcContent(val role: String, val parts: List<FcPart>)
@Serializable private data class FcRequest(val contents: List<FcContent>)
@Serializable private data class FcResponse(val text: String)

// ─── Screen ───────────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FlashcardGeneratorScreen() {
    var topic       by remember { mutableStateOf("") }
    var deckName    by remember { mutableStateOf("") }
    var cardCount   by remember { mutableStateOf(5) }
    var isGenerating by remember { mutableStateOf(false) }
    var isSaving    by remember { mutableStateOf(false) }
    var flashcards  by remember { mutableStateOf<List<GeneratedCard>>(emptyList()) }
    var errorMsg    by remember { mutableStateOf<String?>(null) }
    val coroutineScope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    fun generate() {
        if (topic.isBlank()) return
        isGenerating = true
        errorMsg = null
        flashcards = emptyList()
        coroutineScope.launch {
            try {
                val prompt = """Generate exactly $cardCount flashcards about: "$topic".
Return ONLY a valid JSON array with no markdown, no explanation, no code fences.
Format: [{"front":"question","back":"answer"},...]"""

                val request = FcRequest(
                    contents = listOf(FcContent("user", listOf(FcPart(prompt))))
                )
                val response = SupabaseClient.client.functions
                    .invoke("gemini-chat") { body = request }
                val raw = response.decodeAs<FcResponse>().text.trim()

                // Strip markdown code fences if present
                val jsonStr = raw
                    .removePrefix("```json").removePrefix("```")
                    .removeSuffix("```").trim()

                val jsonArray = Json.parseToJsonElement(jsonStr).jsonArray
                flashcards = jsonArray.map { el ->
                    val obj = el.jsonObject
                    GeneratedCard(
                        front = obj["front"]?.jsonPrimitive?.content ?: "",
                        back  = obj["back"]?.jsonPrimitive?.content  ?: ""
                    )
                }
                if (deckName.isBlank()) deckName = topic.take(30)
            } catch (e: Exception) {
                errorMsg = "Generation failed: ${e.localizedMessage}"
                snackbarHostState.showSnackbar(errorMsg!!)
            } finally {
                isGenerating = false
            }
        }
    }

    fun saveAll() {
        if (flashcards.isEmpty()) return
        isSaving = true
        coroutineScope.launch {
            try {
                val userId = SupabaseClient.client.auth.currentUserOrNull()?.id ?: run {
                    snackbarHostState.showSnackbar("Not signed in")
                    return@launch
                }
                val deck = deckName.ifBlank { topic.take(30) }
                val rows = flashcards.map { card ->
                    mapOf(
                        "user_id"   to userId,
                        "deck_name" to deck,
                        "front"     to card.front,
                        "back"      to card.back
                    )
                }
                // Insert all at once (Supabase kt supports bulk insert via list)
                rows.forEach { row ->
                    SupabaseClient.client.from("flashcards").insert(row)
                }
                // Record study event
                SupabaseClient.client.from("study_events").insert(
                    mapOf("user_id" to userId, "event_type" to "flashcard_reviewed")
                )
                snackbarHostState.showSnackbar("✅ ${flashcards.size} cards saved to \"$deck\"!")
            } catch (e: Exception) {
                snackbarHostState.showSnackbar("Save failed: ${e.localizedMessage}")
            } finally {
                isSaving = false
            }
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header
            item {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier.size(48.dp).clip(RoundedCornerShape(14.dp))
                            .background(MaterialTheme.colorScheme.primary.copy(0.12f)),
                        contentAlignment = Alignment.Center
                    ) { Text("🃏", fontSize = 24.sp) }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text("Flashcard Generator", fontSize = 22.sp, fontWeight = FontWeight.Bold)
                        Text("AI-powered cards from any topic", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }

            // Input card
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedTextField(
                            value = topic,
                            onValueChange = { topic = it },
                            label = { Text("Topic *") },
                            placeholder = { Text("e.g. Photosynthesis, The French Revolution") },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = deckName,
                            onValueChange = { deckName = it },
                            label = { Text("Deck Name (optional)") },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            singleLine = true
                        )
                        // Card count selector
                        Column {
                            Text("Number of cards: $cardCount", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Slider(
                                value = cardCount.toFloat(),
                                onValueChange = { cardCount = it.toInt() },
                                valueRange = 3f..20f,
                                steps = 16,
                                modifier = Modifier.fillMaxWidth()
                            )
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("3", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text("20", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                        Button(
                            onClick = { generate() },
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                            shape = RoundedCornerShape(14.dp),
                            enabled = topic.isNotBlank() && !isGenerating
                        ) {
                            if (isGenerating) {
                                CircularProgressIndicator(
                                    color = MaterialTheme.colorScheme.onPrimary,
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Text("Generating $cardCount cards...")
                            } else {
                                Icon(Icons.Filled.AutoAwesome, null, modifier = Modifier.size(20.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Generate with AI ⚡", fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }
            }

            // Generated cards header + save button
            if (flashcards.isNotEmpty()) {
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Generated Cards", fontSize = 18.sp, fontWeight = FontWeight.Bold)
                            Text("${flashcards.size} cards • tap to flip", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Button(
                            onClick = { saveAll() },
                            enabled = !isSaving,
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
                        ) {
                            if (isSaving) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), color = MaterialTheme.colorScheme.onSecondary)
                            } else {
                                Icon(Icons.Filled.Save, null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Save All")
                            }
                        }
                    }
                }

                items(flashcards.size) { idx ->
                    FlipCard3D(
                        front = flashcards[idx].front,
                        back = flashcards[idx].back,
                        index = idx + 1
                    )
                }

                item { Spacer(modifier = Modifier.height(24.dp)) }
            }
        }
    }
}

// ─── 3D Flip Card ─────────────────────────────────────────────────────────────
@Composable
fun FlipCard3D(front: String, back: String, index: Int) {
    var flipped by remember { mutableStateOf(false) }
    val rotation by animateFloatAsState(
        targetValue = if (flipped) 180f else 0f,
        animationSpec = tween(durationMillis = 450),
        label = "flip"
    )

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(160.dp)
            .graphicsLayer {
                rotationY = rotation
                cameraDistance = 14f * density
            }
            .clickable { flipped = !flipped },
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (rotation <= 90f) MaterialTheme.colorScheme.surface
                             else MaterialTheme.colorScheme.primaryContainer
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Box(modifier = Modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.Center) {
            if (rotation <= 90f) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            "Q$index",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(MaterialTheme.colorScheme.primary.copy(0.1f))
                                .padding(horizontal = 6.dp, vertical = 3.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Question · tap to see answer", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(front, textAlign = TextAlign.Center, fontSize = 16.sp, fontWeight = FontWeight.Medium, color = MaterialTheme.colorScheme.onSurface)
                }
            } else {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.graphicsLayer { rotationY = 180f }
                ) {
                    Text(
                        "Answer",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(MaterialTheme.colorScheme.primary.copy(0.15f))
                            .padding(horizontal = 6.dp, vertical = 3.dp)
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(back, textAlign = TextAlign.Center, fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onPrimaryContainer)
                }
            }
        }
    }
}
