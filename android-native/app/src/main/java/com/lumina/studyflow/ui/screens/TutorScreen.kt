package com.lumina.studyflow.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.lumina.studyflow.data.supabase.SupabaseClient
import com.lumina.studyflow.ui.viewmodels.ChatMessage
import com.lumina.studyflow.ui.viewmodels.TutorViewModel
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Order
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable

@Serializable
data class ChatSession(
    val id: String = "",
    val title: String = "New Chat",
    val created_at: String = ""
)

private val starterPrompts = listOf(
    Pair("📖", "Explain this topic like I'm 5"),
    Pair("✍️", "Summarize my notes"),
    Pair("🃏", "Generate flashcards"),
    Pair("📝", "Create a practice quiz"),
    Pair("💡", "Give me study tips"),
    Pair("🔍", "Help me find key concepts")
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TutorScreen(viewModel: TutorViewModel = viewModel()) {
    val messages by viewModel.messages.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    var inputText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)

    // Chat sessions
    var sessions by remember { mutableStateOf<List<ChatSession>>(emptyList()) }
    var currentSessionId by remember { mutableStateOf<String?>(null) }

    suspend fun loadSessions() {
        try {
            val userId = SupabaseClient.client.auth.currentUserOrNull()?.id ?: return
            sessions = SupabaseClient.client.from("chat_sessions")
                .select { filter { eq("user_id", userId) }; order("created_at", Order.DESCENDING) }
                .decodeList<ChatSession>()
        } catch (_: Exception) {}
    }

    LaunchedEffect(Unit) { loadSessions() }

    // Auto scroll to bottom when new messages arrive
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) listState.animateScrollToItem(messages.size - 1)
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(modifier = Modifier.width(300.dp)) {
                Column(modifier = Modifier.fillMaxSize()) {
                    // Drawer header
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(20.dp, 20.dp, 12.dp, 16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Chat Sessions", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        IconButton(onClick = {
                            // Just clear — ViewModel auto-creates session on next message
                            viewModel.clearMessages()
                            currentSessionId = null
                            coroutineScope.launch { drawerState.close() }
                        }) {
                            Icon(Icons.Filled.Add, contentDescription = "New Chat")
                        }
                    }
                    HorizontalDivider()

                    if (sessions.isEmpty()) {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("💬", fontSize = 40.sp)
                                Text("No sessions yet", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 14.sp)
                            }
                        }
                    } else {
                        LazyColumn(modifier = Modifier.fillMaxSize().padding(top = 8.dp)) {
                            items(sessions) { session ->
                                NavigationDrawerItem(
                                    label = {
                                        Text(session.title, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    },
                                    selected = session.id == currentSessionId,
                                    onClick = {
                                        currentSessionId = session.id
                                        viewModel.loadSession(session.id)
                                        coroutineScope.launch { drawerState.close() }
                                    },
                                    icon = { Text("💬") },
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    ) {
        Column(
            modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)
        ) {
            // ── Top App Bar ────────────────────────────────────────────────
            TopAppBar(
                title = { Text("AI Tutor", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { coroutineScope.launch { drawerState.open() } }) {
                        Icon(Icons.Filled.Menu, contentDescription = "Sessions")
                    }
                },
                actions = {
                    IconButton(onClick = {
                        viewModel.clearMessages()
                        currentSessionId = null
                    }) {
                        Icon(Icons.Filled.Edit, contentDescription = "New Chat")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface
                )
            )

            // ── Chat or Starter Cards ──────────────────────────────────────
            Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                if (messages.isEmpty() && !isLoading) {
                    // Starter cards
                    LazyColumn(
                        modifier = Modifier.fillMaxSize().padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        item {
                            Column(modifier = Modifier.padding(bottom = 8.dp)) {
                                Text("AI Tutor", fontSize = 26.sp, fontWeight = FontWeight.Bold)
                                Text("Your intelligent study companion. Ask anything.", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                        item {
                            Text("Quick starters", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onBackground)
                            Spacer(modifier = Modifier.height(8.dp))
                        }
                        // Starter prompt grid (2 columns)
                        val rows = starterPrompts.chunked(2)
                        items(rows) { row ->
                            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                row.forEach { (emoji, prompt) ->
                                    StarterCard(
                                        emoji = emoji,
                                        text = prompt,
                                        modifier = Modifier.weight(1f),
                                        onClick = {
                                            viewModel.sendMessage(prompt)
                                            inputText = ""
                                        }
                                    )
                                }
                                if (row.size == 1) Spacer(modifier = Modifier.weight(1f))
                            }
                        }
                    }
                } else {
                    // Message list
                    LazyColumn(
                        state = listState,
                        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
                        contentPadding = PaddingValues(vertical = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(messages) { message ->
                            EnhancedChatBubble(message = message)
                        }
                        if (isLoading) {
                            item {
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(start = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier.size(32.dp).clip(CircleShape)
                                            .background(MaterialTheme.colorScheme.primary.copy(0.12f)),
                                        contentAlignment = Alignment.Center
                                    ) { Text("🤖", fontSize = 16.sp) }
                                    Spacer(modifier = Modifier.width(8.dp))
                                    TypingIndicator()
                                }
                            }
                        }
                    }
                }
            }

            // ── Input Row ──────────────────────────────────────────────────
            Surface(
                color = MaterialTheme.colorScheme.surface,
                tonalElevation = 4.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(12.dp, 8.dp, 12.dp, 12.dp).fillMaxWidth(),
                    verticalAlignment = Alignment.Bottom
                ) {
                    OutlinedTextField(
                        value = inputText,
                        onValueChange = { inputText = it },
                        placeholder = { Text("Ask your tutor anything...") },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(24.dp),
                        maxLines = 4,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = MaterialTheme.colorScheme.primary,
                            unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(0.5f)
                        )
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    // Send button
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(
                                if (inputText.isNotBlank() && !isLoading)
                                    MaterialTheme.colorScheme.primary
                                else
                                    MaterialTheme.colorScheme.surfaceVariant
                            )
                            .clickable(enabled = inputText.isNotBlank() && !isLoading) {
                                val msg = inputText.trim()
                                viewModel.sendMessage(msg)
                                inputText = ""
                                // Refresh session list to show new/updated title
                                coroutineScope.launch { loadSessions() }
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Filled.Send,
                            contentDescription = "Send",
                            tint = if (inputText.isNotBlank() && !isLoading)
                                MaterialTheme.colorScheme.onPrimary
                            else
                                MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
        }
    }
}

// ─── Starter Card ──────────────────────────────────────────────────────────────
@Composable
private fun StarterCard(emoji: String, text: String, modifier: Modifier, onClick: () -> Unit) {
    Card(
        modifier = modifier.clickable { onClick() }.aspectRatio(1.6f),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(14.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Text(emoji, fontSize = 24.sp)
            Text(text, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = MaterialTheme.colorScheme.onSurface, maxLines = 2, overflow = TextOverflow.Ellipsis)
        }
    }
}

// ─── Enhanced Chat Bubble ──────────────────────────────────────────────────────
@Composable
fun EnhancedChatBubble(message: ChatMessage) {
    val isUser = message.role == "user"
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = if (isUser) Alignment.End else Alignment.Start
    ) {
        if (!isUser) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 4.dp)) {
                Box(
                    modifier = Modifier.size(24.dp).clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primary.copy(0.12f)),
                    contentAlignment = Alignment.Center
                ) { Text("🤖", fontSize = 12.sp) }
                Spacer(modifier = Modifier.width(6.dp))
                Text("AI Tutor", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.primary)
            }
        }
        Surface(
            color = if (isUser) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
            shape = RoundedCornerShape(
                topStart = 18.dp, topEnd = 18.dp,
                bottomStart = if (isUser) 18.dp else 4.dp,
                bottomEnd = if (isUser) 4.dp else 18.dp
            ),
            modifier = Modifier.widthIn(max = 300.dp)
        ) {
            Text(
                text = message.content,
                color = if (isUser) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface,
                fontSize = 15.sp,
                lineHeight = 22.sp,
                modifier = Modifier.padding(14.dp)
            )
        }
    }
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────
@Composable
private fun TypingIndicator() {
    val infiniteTransition = rememberInfiniteTransition(label = "typing")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(600),
            repeatMode = RepeatMode.Reverse
        ),
        label = "alpha"
    )
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.surfaceVariant
    ) {
        Row(modifier = Modifier.padding(12.dp, 8.dp), horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
            repeat(3) { i ->
                Box(
                    modifier = Modifier.size(8.dp).clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primary.copy(alpha = alpha * (1f - i * 0.2f)))
                )
            }
        }
    }
}
