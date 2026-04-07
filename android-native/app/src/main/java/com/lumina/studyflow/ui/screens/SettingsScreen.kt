package com.lumina.studyflow.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lumina.studyflow.data.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.launch

@Composable
fun SettingsScreen(onSignOut: () -> Unit = {}) {
    val coroutineScope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    var displayName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    var showClearChatDialog by remember { mutableStateOf(false) }

    // Academic details
    var university by remember { mutableStateOf("") }
    var courseOfStudy by remember { mutableStateOf("") }
    var level by remember { mutableStateOf("") }
    var savingAcademic by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        val user = SupabaseClient.client.auth.currentUserOrNull()
        email = user?.email ?: ""
        displayName = user?.userMetadata?.get("full_name")?.toString()?.trim('"') ?: ""
        try {
            val userId = user?.id ?: return@LaunchedEffect
            val profile = SupabaseClient.client.from("profiles")
                .select { filter { eq("id", userId) } }
                .decodeSingleOrNull<Map<String, String>>()
            university = profile?.get("university") ?: ""
            courseOfStudy = profile?.get("course_of_study") ?: ""
            level = profile?.get("level") ?: ""
        } catch (_: Exception) {}
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("Settings", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
            Text("Manage your preferences and privacy.", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)

            // ── Profile Card ──────────────────────────────────────
            SettingsCard(title = "Profile", icon = Icons.Filled.Person) {
                OutlinedTextField(
                    value = displayName,
                    onValueChange = { displayName = it },
                    label = { Text("Display Name") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = email,
                    onValueChange = {},
                    label = { Text("Email") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    enabled = false,
                    singleLine = true
                )
                Spacer(modifier = Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Button(
                        onClick = {
                            coroutineScope.launch {
                                isLoading = true
                                try {
                                    SupabaseClient.client.auth.modifyUser {
                                        data = mapOf("full_name" to displayName)
                                    }
                                    val userId = SupabaseClient.client.auth.currentUserOrNull()?.id ?: return@launch
                                    SupabaseClient.client.from("profiles")
                                        .update(mapOf("full_name" to displayName)) { filter { eq("id", userId) } }
                                    snackbarHostState.showSnackbar("Profile updated!")
                                } catch (e: Exception) {
                                    snackbarHostState.showSnackbar("Error: ${e.localizedMessage}")
                                } finally {
                                    isLoading = false
                                }
                            }
                        },
                        modifier = Modifier.weight(1f),
                        enabled = !isLoading
                    ) {
                        if (isLoading) CircularProgressIndicator(modifier = Modifier.size(18.dp), color = MaterialTheme.colorScheme.onPrimary)
                        else Text("Save Changes")
                    }
                    OutlinedButton(
                        onClick = {
                            coroutineScope.launch {
                                SupabaseClient.client.auth.signOut()
                                onSignOut()
                            }
                        },
                        modifier = Modifier.weight(1f)
                    ) { Text("Sign Out") }
                }
            }

            // ── Academic Details Card ─────────────────────────────
            SettingsCard(title = "Academic Details", icon = Icons.Filled.School) {
                OutlinedTextField(
                    value = university, onValueChange = { university = it },
                    label = { Text("University") }, modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp), singleLine = true
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = courseOfStudy, onValueChange = { courseOfStudy = it },
                    label = { Text("Course of Study") }, modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp), singleLine = true
                )
                Spacer(modifier = Modifier.height(8.dp))
                // Level selector chips
                Text("Level", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(modifier = Modifier.height(4.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("100", "200", "300", "400", "500").forEach { lvl ->
                        val lbl = "$lvl Level"
                        FilterChip(
                            selected = level == lbl,
                            onClick = { level = lbl },
                            label = { Text(lvl) }
                        )
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = {
                        coroutineScope.launch {
                            savingAcademic = true
                            try {
                                val userId = SupabaseClient.client.auth.currentUserOrNull()?.id ?: return@launch
                                SupabaseClient.client.from("profiles").update(
                                    mapOf("university" to university, "course_of_study" to courseOfStudy, "level" to level)
                                ) { filter { eq("id", userId) } }
                                SupabaseClient.client.postgrest.rpc(
                                    "upsert_user_group",
                                    mapOf("p_university" to university, "p_course_of_study" to courseOfStudy, "p_level" to level)
                                )
                                snackbarHostState.showSnackbar("Academic details saved!")
                            } catch (e: Exception) {
                                snackbarHostState.showSnackbar("Error: ${e.localizedMessage}")
                            } finally {
                                savingAcademic = false
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !savingAcademic && university.isNotEmpty() && courseOfStudy.isNotEmpty() && level.isNotEmpty()
                ) {
                    if (savingAcademic) CircularProgressIndicator(modifier = Modifier.size(18.dp), color = MaterialTheme.colorScheme.onPrimary)
                    else Text("Save Details")
                }
            }

            // ── Data & Privacy Card ───────────────────────────────
            SettingsCard(title = "Data & Privacy", icon = Icons.Filled.Storage) {
                SettingsRow(
                    title = "Clear Chat History",
                    subtitle = "Delete all AI tutor conversations"
                ) {
                    OutlinedButton(onClick = { showClearChatDialog = true }) {
                        Text("Clear")
                    }
                }
            }

            // ── About Card ────────────────────────────────────────
            SettingsCard(title = "About", icon = Icons.Filled.Info) {
                Text("StudyFlow v1.0.0", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurface)
                Text("Made with ❤️ for students everywhere", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }

            // ── Danger Zone ───────────────────────────────────────
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = CardDefaults.outlinedCardBorder().copy(
                    brush = androidx.compose.ui.graphics.SolidColor(MaterialTheme.colorScheme.error.copy(alpha = 0.3f))
                )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Shield, null, tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Danger Zone", fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurface, fontSize = 16.sp)
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    SettingsRow("Delete Account", "Permanently remove all data") {
                        Button(
                            onClick = { showDeleteDialog = true },
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                        ) { Text("Delete") }
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }

    // Clear Chat Confirmation Dialog
    if (showClearChatDialog) {
        AlertDialog(
            onDismissRequest = { showClearChatDialog = false },
            title = { Text("Clear all chat history?") },
            text = { Text("This will permanently delete all your AI tutor conversations. This action cannot be undone.") },
            confirmButton = {
                Button(
                    onClick = {
                        showClearChatDialog = false
                        coroutineScope.launch {
                            try {
                                val userId = SupabaseClient.client.auth.currentUserOrNull()?.id ?: return@launch
                                SupabaseClient.client.from("chat_sessions").delete { filter { eq("user_id", userId) } }
                                snackbarHostState.showSnackbar("Chat history cleared.")
                            } catch (e: Exception) {
                                snackbarHostState.showSnackbar("Error: ${e.localizedMessage}")
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) { Text("Yes, Clear All") }
            },
            dismissButton = { TextButton(onClick = { showClearChatDialog = false }) { Text("Cancel") } }
        )
    }

    // Delete Account Confirmation Dialog
    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Account?") },
            text = { Text("This will permanently delete your account, all documents, quizzes, flashcards, and chat history. This cannot be undone.") },
            confirmButton = {
                Button(
                    onClick = {
                        showDeleteDialog = false
                        coroutineScope.launch {
                            try {
                                SupabaseClient.client.postgrest.rpc("delete_own_account", emptyMap<String, String>())
                                SupabaseClient.client.auth.signOut()
                                onSignOut()
                            } catch (e: Exception) {
                                snackbarHostState.showSnackbar("Error: ${e.localizedMessage}")
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) { Text("Yes, Delete Everything") }
            },
            dismissButton = { TextButton(onClick = { showDeleteDialog = false }) { Text("Cancel") } }
        )
    }
}

@Composable
private fun SettingsCard(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 12.dp)) {
                Icon(icon, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text(title, fontWeight = FontWeight.SemiBold, fontSize = 16.sp, color = MaterialTheme.colorScheme.onSurface)
            }
            content()
        }
    }
}

@Composable
private fun SettingsRow(title: String, subtitle: String, trailing: @Composable () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(title, fontWeight = FontWeight.Medium, fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurface)
            Text(subtitle, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        trailing()
    }
}
