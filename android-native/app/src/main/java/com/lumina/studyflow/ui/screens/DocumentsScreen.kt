package com.lumina.studyflow.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Description
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

@Serializable
data class UserFile(
    val id: String = "",
    val user_id: String = "",
    val file_name: String = "",
    val file_path: String = "",
    val file_size: Long? = null,
    val mime_type: String? = null,
    val created_at: String = ""
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DocumentsScreen() {
    var files by remember { mutableStateOf<List<UserFile>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    val coroutineScope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    fun loadFiles() {
        coroutineScope.launch {
            isLoading = true
            try {
                val userId = SupabaseClient.client.auth.currentUserOrNull()?.id ?: return@launch
                val result = SupabaseClient.client.from("user_files")
                    .select {
                        filter { eq("user_id", userId) }
                        order("created_at", Order.DESCENDING)
                    }
                    .decodeList<UserFile>()
                files = result
            } catch (e: Exception) {
                snackbarHostState.showSnackbar("Failed to load documents")
            } finally {
                isLoading = false
            }
        }
    }

    fun deleteFile(file: UserFile) {
        coroutineScope.launch {
            try {
                // Delete from DB (trigger should handle storage deletion, or we'd do it here)
                SupabaseClient.client.from("user_files").delete { filter { eq("id", file.id) } }
                loadFiles()
            } catch (e: Exception) {
                snackbarHostState.showSnackbar("Failed to delete document")
            }
        }
    }

    LaunchedEffect(Unit) { loadFiles() }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
                Text("My Documents", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
                Text("View your uploaded study materials.", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }

            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (files.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("📄", fontSize = 48.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("No documents yet", fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onBackground)
                        Text("Upload documents from the Web App", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(files, key = { it.id }) { file ->
                        DocumentCard(file = file, onDelete = { deleteFile(file) })
                    }
                }
            }
        }
    }
}

@Composable
fun DocumentCard(file: UserFile, onDelete: () -> Unit) {
    val sizeKb = (file.file_size ?: 0) / 1024L
    val sizeText = if (sizeKb > 1024) "${sizeKb / 1024} MB" else "$sizeKb KB"

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
                modifier = Modifier.size(48.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primary.copy(0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Filled.Description, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(file.file_name, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MaterialTheme.colorScheme.onSurface, maxLines = 1)
                Text(sizeText, fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            IconButton(onClick = onDelete) {
                Icon(Icons.Filled.Delete, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error)
            }
        }
    }
}
