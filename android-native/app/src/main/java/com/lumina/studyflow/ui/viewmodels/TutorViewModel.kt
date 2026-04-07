package com.lumina.studyflow.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lumina.studyflow.data.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.functions.functions
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Order
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable

@Serializable
data class ChatMessage(
    val role: String,
    val content: String
)

@Serializable
data class AiRequestPart(val text: String)

@Serializable
data class AiRequestContent(
    val role: String,
    val parts: List<AiRequestPart>
)

@Serializable
data class AiRequestBody(
    val contents: List<AiRequestContent>
)

@Serializable
data class AiResponse(val text: String)

@Serializable
data class StoredMessage(
    val id: String = "",
    val session_id: String = "",
    val role: String = "",
    val content: String = "",
    val created_at: String = ""
)

// For auto-created session id return
@Serializable
private data class NewSession(val id: String)

private const val SYSTEM_PROMPT = """You are StudyFlow, a friendly, knowledgeable, and encouraging AI tutor. \
Your role is to help students learn, understand difficult concepts, and prepare for exams. \
Always be concise, use clear formatting (bullet points, headers) when helpful, and keep answers focused on academics. \
If a student seems confused, break things down step by step."""

class TutorViewModel : ViewModel() {

    private val _messages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val messages: StateFlow<List<ChatMessage>> = _messages.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    // Holds the active session id (auto-created after first message)
    private val _sessionId = MutableStateFlow<String?>(null)
    val sessionId: StateFlow<String?> = _sessionId.asStateFlow()

    init { showGreeting() }

    private fun showGreeting() {
        _messages.value = listOf(
            ChatMessage(role = "model", content = "Hello! I'm StudyFlow, your personal AI tutor. What would you like to learn today? 🎓")
        )
    }

    fun clearMessages() {
        _messages.value = emptyList()
        _sessionId.value = null
        showGreeting()
    }

    /** Load messages from an existing chat session */
    fun loadSession(sessionId: String) {
        _sessionId.value = sessionId
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val rows = SupabaseClient.client.from("chat_messages")
                    .select { filter { eq("session_id", sessionId) }; order("created_at", Order.ASCENDING) }
                    .decodeList<StoredMessage>()
                _messages.value = rows.map { ChatMessage(role = it.role, content = it.content) }
            } catch (_: Exception) {
            } finally {
                _isLoading.value = false
            }
        }
    }

    /**
     * Send a message to the AI tutor.
     * Automatically creates a chat session on the first message (matching web behaviour).
     * The system prompt is injected as the first "user" turn so the AI always behaves as StudyFlow.
     */
    fun sendMessage(text: String) {
        if (text.isBlank()) return

        val userMessage = ChatMessage(role = "user", content = text)
        _messages.value = _messages.value + userMessage
        _isLoading.value = true

        viewModelScope.launch {
            // ── 1. Auto-create session on first user message ──────────────────
            val userId = SupabaseClient.client.auth.currentUserOrNull()?.id
            var activeSessionId = _sessionId.value

            if (activeSessionId == null && userId != null) {
                try {
                    val title = text.take(40).trimEnd() + if (text.length > 40) "…" else ""
                    val row = SupabaseClient.client.from("chat_sessions")
                        .insert(mapOf("user_id" to userId, "title" to title))
                        { select() }
                        .decodeSingle<NewSession>()
                    activeSessionId = row.id
                    _sessionId.value = activeSessionId
                } catch (_: Exception) {}
            }

            // ── 2. Persist user message ───────────────────────────────────────
            if (activeSessionId != null) {
                try {
                    SupabaseClient.client.from("chat_messages").insert(
                        mapOf("session_id" to activeSessionId, "role" to "user", "content" to text)
                    )
                } catch (_: Exception) {}
            }

            // ── 3. Build AI request with system prompt prepended ─────────────
            try {
                // Build conversation history as Gemini expects (alternating user/model)
                // Prepend the system prompt as the first user turn so Gemini adopts the persona
                val historyForAI = mutableListOf(
                    AiRequestContent(
                        role = "user",
                        parts = listOf(AiRequestPart(text = SYSTEM_PROMPT))
                    ),
                    AiRequestContent(
                        role = "model",
                        parts = listOf(AiRequestPart(text = "Understood! I'm ready to help you study. 🎓"))
                    )
                )

                // Add real conversation (skip the greeting bot message, only include actual exchanges)
                val realHistory = _messages.value.dropLast(1) // drop the message we just added
                historyForAI.addAll(
                    realHistory
                        .filter { it.role == "user" || it.role == "model" }
                        .takeLast(10) // keep last 10 messages for context window
                        .map { msg ->
                            AiRequestContent(
                                role = msg.role,
                                parts = listOf(AiRequestPart(text = msg.content))
                            )
                        }
                )

                // Add current user message
                historyForAI.add(
                    AiRequestContent(
                        role = "user",
                        parts = listOf(AiRequestPart(text = text))
                    )
                )

                val response = SupabaseClient.client.functions
                    .invoke("gemini-chat") { body = AiRequestBody(contents = historyForAI) }

                val aiData = response.decodeAs<AiResponse>()
                val modelMessage = ChatMessage(role = "model", content = aiData.text)
                _messages.value = _messages.value + modelMessage

                // ── 4. Persist AI response ──────────────────────────────────
                if (activeSessionId != null) {
                    try {
                        SupabaseClient.client.from("chat_messages").insert(
                            mapOf("session_id" to activeSessionId, "role" to "model", "content" to aiData.text)
                        )
                        // Update session title on first real exchange
                        if (_messages.value.size <= 4) {
                            val snippet = text.take(40).trimEnd() + if (text.length > 40) "…" else ""
                            SupabaseClient.client.from("chat_sessions")
                                .update(mapOf("title" to snippet)) { filter { eq("id", activeSessionId) } }
                        }
                    } catch (_: Exception) {}
                }

            } catch (e: Exception) {
                _messages.value = _messages.value + ChatMessage(
                    role = "model",
                    content = "Sorry, I couldn't connect right now. Please check your connection and try again. ⚡"
                )
            } finally {
                _isLoading.value = false
            }
        }
    }
}
