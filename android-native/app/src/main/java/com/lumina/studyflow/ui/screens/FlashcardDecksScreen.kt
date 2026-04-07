package com.lumina.studyflow.ui.screens

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lumina.studyflow.data.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.from
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable

@Serializable
data class Flashcard(
    val id: String = "",
    val front: String = "",
    val back: String = "",
    val deck_name: String? = null,
    val created_at: String = ""
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FlashcardDecksScreen(onNavigateToGenerator: () -> Unit = {}) {
    val coroutineScope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    var flashcards by remember { mutableStateOf<List<Flashcard>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var selectedDeck by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        try {
            val userId = SupabaseClient.client.auth.currentUserOrNull()?.id ?: return@LaunchedEffect
            flashcards = SupabaseClient.client.from("flashcards")
                .select { filter { eq("user_id", userId) } }
                .decodeList<Flashcard>()
        } catch (e: Exception) {
            snackbarHostState.showSnackbar("Failed to load: ${e.localizedMessage}")
        } finally {
            isLoading = false
        }
    }

    val decks = flashcards.groupBy { it.deck_name ?: "General" }
    val deckNames = decks.keys.toList()
    val selectedCards = selectedDeck?.let { decks[it] } ?: emptyList()

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        if (isLoading) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            return@Scaffold
        }

        // If a deck is open, show the flip-card viewer
        if (selectedDeck != null) {
            DeckViewer(
                deckName = selectedDeck!!,
                cards = selectedCards,
                onBack = { selectedDeck = null },
                onDelete = { id ->
                    coroutineScope.launch {
                        try {
                            SupabaseClient.client.from("flashcards").delete { filter { eq("id", id) } }
                            flashcards = flashcards.filter { it.id != id }
                        } catch (_: Exception) {}
                    }
                }
            )
            return@Scaffold
        }

        // Deck grid / empty state
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 8.dp)) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("My Flashcards", fontSize = 26.sp, fontWeight = FontWeight.Bold)
                        Text("${flashcards.size} cards across ${deckNames.size} deck${if (deckNames.size != 1) "s" else ""}", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    OutlinedButton(onClick = onNavigateToGenerator) {
                        Icon(Icons.Filled.Add, null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Generate")
                    }
                }
            }

            if (deckNames.isEmpty()) {
                item {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 48.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("📖", fontSize = 56.sp)
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("No flashcards yet", fontWeight = FontWeight.SemiBold, fontSize = 18.sp)
                        Text("Generate flashcards from the AI Tutor.", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = onNavigateToGenerator) { Text("Go to AI Tutor") }
                    }
                }
            } else {
                items(deckNames) { deckName ->
                    DeckCard(
                        deckName = deckName,
                        cardCount = decks[deckName]?.size ?: 0,
                        preview = decks[deckName]?.firstOrNull()?.front ?: "",
                        onClick = { selectedDeck = deckName }
                    )
                }
            }
        }
    }
}

// ─── Deck Card ────────────────────────────────────────────────────────────────
@Composable
private fun DeckCard(deckName: String, cardCount: Int, preview: String, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable { onClick() },
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
    ) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier.size(52.dp).clip(RoundedCornerShape(14.dp))
                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Text("🃏", fontSize = 26.sp)
            }
            Spacer(modifier = Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(deckName, fontWeight = FontWeight.Bold, fontSize = 16.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text("$cardCount card${if (cardCount != 1) "s" else ""}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                if (preview.isNotEmpty()) {
                    Text(preview, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(top = 2.dp))
                }
            }
            Icon(Icons.Filled.ChevronRight, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

// ─── Flip Card Viewer ─────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DeckViewer(
    deckName: String,
    cards: List<Flashcard>,
    onBack: () -> Unit,
    onDelete: (String) -> Unit
) {
    var currentIndex by remember { mutableStateOf(0) }
    var isFlipped by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        // Top bar
        TopAppBar(
            title = { Text(deckName) },
            navigationIcon = {
                IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null) }
            },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = MaterialTheme.colorScheme.surface
            )
        )

        if (cards.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No cards in this deck", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            return@Column
        }

        val card = cards[currentIndex]

        // Progress bar
        Column(modifier = Modifier.padding(horizontal = 24.dp, vertical = 8.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("${currentIndex + 1} / ${cards.size}", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, fontWeight = FontWeight.SemiBold)
                Text("Tap card to flip", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Spacer(modifier = Modifier.height(6.dp))
            LinearProgressIndicator(
                progress = { (currentIndex + 1).toFloat() / cards.size },
                modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                color = MaterialTheme.colorScheme.primary
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Flip Card
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .height(280.dp)
                .clip(RoundedCornerShape(24.dp))
                .clickable { isFlipped = !isFlipped },
            contentAlignment = Alignment.Center
        ) {
            AnimatedContent(
                targetState = isFlipped,
                transitionSpec = {
                    fadeIn(animationSpec = tween(300)) togetherWith fadeOut(animationSpec = tween(200))
                },
                label = "flip"
            ) { flipped ->
                Card(
                    modifier = Modifier.fillMaxSize(),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (flipped) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
                ) {
                    Column(
                        modifier = Modifier.fillMaxSize().padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            if (flipped) "Answer" else "Question",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (flipped) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (flipped) MaterialTheme.colorScheme.primary.copy(0.1f) else MaterialTheme.colorScheme.surfaceVariant)
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            if (flipped) card.back else card.front,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = if (flipped) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurface,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        // Navigation buttons
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedButton(
                onClick = { if (currentIndex > 0) { currentIndex--; isFlipped = false } },
                enabled = currentIndex > 0
            ) {
                Icon(Icons.Filled.ArrowBack, null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Previous")
            }

            // Delete card
            IconButton(onClick = { onDelete(card.id); if (currentIndex >= cards.size - 1 && currentIndex > 0) currentIndex-- }) {
                Icon(Icons.Filled.Delete, null, tint = MaterialTheme.colorScheme.error)
            }

            Button(
                onClick = { if (currentIndex < cards.size - 1) { currentIndex++; isFlipped = false } },
                enabled = currentIndex < cards.size - 1
            ) {
                Text("Next")
                Spacer(modifier = Modifier.width(4.dp))
                Icon(Icons.Filled.ArrowForward, null, modifier = Modifier.size(16.dp))
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // All cards list
        Text("All cards in deck:", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onBackground, modifier = Modifier.padding(horizontal = 24.dp))
        Spacer(modifier = Modifier.height(8.dp))
        LazyColumn(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(bottom = 32.dp)
        ) {
            items(cards, key = { it.id }) { c ->
                Card(
                    modifier = Modifier.fillMaxWidth().clickable { currentIndex = cards.indexOf(c); isFlipped = false },
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.Top) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(c.front, fontWeight = FontWeight.Medium, fontSize = 13.sp)
                            Text(c.back, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 2.dp))
                        }
                        IconButton(onClick = { onDelete(c.id) }, modifier = Modifier.size(32.dp)) {
                            Icon(Icons.Filled.Delete, null, tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }
        }
    }
}
