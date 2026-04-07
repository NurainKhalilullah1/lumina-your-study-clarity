package com.lumina.studyflow.ui.screens

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
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
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
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
data class Assignment(
    val id: String = "",
    val title: String = "",
    val due_date: String = "",
    val status: String = "pending",
    val course_name: String? = null,
    val type: String = "assignment",
    val priority: String = "medium"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AssignmentsScreen() {
    val coroutineScope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    var assignments by remember { mutableStateOf<List<Assignment>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var showAddDialog by remember { mutableStateOf(false) }
    var selectedAssignment by remember { mutableStateOf<Assignment?>(null) }

    fun loadAssignments() {
        coroutineScope.launch {
            isLoading = true
            try {
                val userId = SupabaseClient.client.auth.currentUserOrNull()?.id ?: return@launch
                assignments = SupabaseClient.client.from("assignments")
                    .select { filter { eq("user_id", userId) }; order("due_date", Order.ASCENDING) }
                    .decodeList<Assignment>()
            } catch (e: Exception) {
                snackbarHostState.showSnackbar("Failed to load: ${e.localizedMessage}")
            } finally {
                isLoading = false
            }
        }
    }

    fun toggleStatus(assignment: Assignment) {
        coroutineScope.launch {
            val newStatus = if (assignment.status == "pending") "completed" else "pending"
            try {
                SupabaseClient.client.from("assignments")
                    .update(mapOf("status" to newStatus)) { filter { eq("id", assignment.id) } }
                assignments = assignments.map { if (it.id == assignment.id) it.copy(status = newStatus) else it }
            } catch (e: Exception) {
                snackbarHostState.showSnackbar("Update failed: ${e.localizedMessage}")
            }
        }
    }

    LaunchedEffect(Unit) { loadAssignments() }

    val pending   = assignments.filter { it.status == "pending" }
    val completed = assignments.filter { it.status == "completed" }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = MaterialTheme.colorScheme.background,
        floatingActionButton = {
            FloatingActionButton(onClick = { showAddDialog = true }) {
                Icon(Icons.Filled.Add, contentDescription = "Add Assignment")
            }
        }
    ) { padding ->
        if (isLoading) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            return@Scaffold
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp, 16.dp, 16.dp, 80.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Header
            item {
                Column(modifier = Modifier.padding(bottom = 8.dp)) {
                    Text("Assignments", fontSize = 28.sp, fontWeight = FontWeight.Bold)
                    Text("Manage your academic workload.", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            // Pending section
            item {
                SectionHeader(Icons.Filled.RadioButtonUnchecked, "Up Next", pending.size, MaterialTheme.colorScheme.primary)
            }
            if (pending.isEmpty()) {
                item {
                    EmptySection(icon = "📥", message = "No pending assignments", sub = "Time to relax or study ahead!")
                }
            } else {
                items(pending, key = { it.id }) { a ->
                    AssignmentCard(
                        assignment = a,
                        onToggle = { toggleStatus(a) },
                        onTap = { selectedAssignment = a }
                    )
                }
            }

            // Completed section
            if (completed.isNotEmpty()) {
                item { Spacer(modifier = Modifier.height(12.dp)) }
                item {
                    SectionHeader(Icons.Filled.CheckCircle, "Completed", completed.size, Color(0xFF22C55E))
                }
                items(completed, key = { it.id }) { a ->
                    AssignmentCard(
                        assignment = a,
                        onToggle = { toggleStatus(a) },
                        onTap = { selectedAssignment = a },
                        dimmed = true
                    )
                }
            }
        }
    }

    // Detail bottom sheet
    selectedAssignment?.let { a ->
        ModalBottomSheet(onDismissRequest = { selectedAssignment = null }) {
            Column(modifier = Modifier.padding(24.dp).navigationBarsPadding()) {
                Text(a.title, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(16.dp))
                DetailRow("Course", a.course_name ?: "General")
                DetailRow("Due Date", formatDate(a.due_date))
                DetailRow("Type", a.type.replaceFirstChar { it.uppercase() })
                DetailRow("Priority", a.priority.replaceFirstChar { it.uppercase() })
                DetailRow("Status", if (a.status == "pending") "Pending" else "Completed")
                Spacer(modifier = Modifier.height(24.dp))
                Button(
                    onClick = { toggleStatus(a); selectedAssignment = null },
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    colors = if (a.status == "pending")
                        ButtonDefaults.buttonColors(containerColor = Color(0xFF22C55E))
                    else ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Icon(
                        if (a.status == "pending") Icons.Filled.CheckCircle else Icons.Filled.Refresh,
                        null, modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(if (a.status == "pending") "Mark as Complete" else "Mark as Pending")
                }
            }
        }
    }

    // Add assignment dialog
    if (showAddDialog) {
        AddAssignmentDialog(
            onDismiss = { showAddDialog = false },
            onSaved = { loadAssignments(); showAddDialog = false }
        )
    }
}

@Composable
private fun AssignmentCard(
    assignment: Assignment,
    onToggle: () -> Unit,
    onTap: () -> Unit,
    dimmed: Boolean = false
) {
    val isDone = assignment.status == "completed"
    val priorityColor = when (assignment.priority) {
        "high"   -> Color(0xFFEF4444)
        "medium" -> Color(0xFFF59E0B)
        else     -> Color(0xFF22C55E)
    }

    Card(
        modifier = Modifier.fillMaxWidth().clickable { onTap() },
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (dimmed) MaterialTheme.colorScheme.surface.copy(alpha = 0.6f) else MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = if (dimmed) 0.dp else 2.dp)
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Checkbox
            Box(
                modifier = Modifier
                    .size(26.dp)
                    .clip(CircleShape)
                    .background(if (isDone) Color(0xFF22C55E) else Color.Transparent)
                    .then(
                        if (!isDone) Modifier.background(
                            MaterialTheme.colorScheme.surfaceVariant, CircleShape
                        ) else Modifier
                    )
                    .clickable { onToggle() },
                contentAlignment = Alignment.Center
            ) {
                if (isDone) Icon(Icons.Filled.Check, null, tint = Color.White, modifier = Modifier.size(14.dp))
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    assignment.title,
                    fontWeight = FontWeight.Medium,
                    textDecoration = if (isDone) TextDecoration.LineThrough else TextDecoration.None,
                    color = if (isDone) MaterialTheme.colorScheme.onSurface.copy(0.5f) else MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.padding(top = 3.dp)) {
                    if (assignment.course_name != null) {
                        Text(
                            "📖 ${assignment.course_name}",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(MaterialTheme.colorScheme.primary.copy(0.1f))
                                .padding(horizontal = 5.dp, vertical = 2.dp)
                        )
                    }
                    Text(
                        "📅 ${formatDate(assignment.due_date)}",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.width(8.dp))

            // Priority dot + type badge
            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(priorityColor))
                if (assignment.type == "exam") {
                    Text(
                        "EXAM",
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFF97316),
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(Color(0xFFF97316).copy(0.12f))
                            .padding(horizontal = 4.dp, vertical = 2.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun SectionHeader(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, count: Int, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 4.dp)) {
        Icon(icon, null, tint = color, modifier = Modifier.size(20.dp))
        Spacer(modifier = Modifier.width(8.dp))
        Text("$title ($count)", fontWeight = FontWeight.SemiBold, fontSize = 16.sp, color = MaterialTheme.colorScheme.onBackground)
    }
    HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)
    Spacer(modifier = Modifier.height(8.dp))
}

@Composable
private fun DetailRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, fontWeight = FontWeight.Medium)
        Text(value, fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurface)
    }
}

@Composable
private fun EmptySection(icon: String, message: String, sub: String) {
    Column(
        modifier = Modifier.fillMaxWidth().padding(vertical = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(icon, fontSize = 40.sp)
        Spacer(modifier = Modifier.height(8.dp))
        Text(message, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurface)
        Text(sub, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

// ─── Add Assignment dialog ─────────────────────────────────────────────────────
@Composable
fun AddAssignmentDialog(onDismiss: () -> Unit, onSaved: () -> Unit) {
    var title      by remember { mutableStateOf("") }
    var courseName by remember { mutableStateOf("") }
    var dueDate    by remember { mutableStateOf("") }
    var type       by remember { mutableStateOf("assignment") }
    var priority   by remember { mutableStateOf("medium") }
    val coroutineScope = rememberCoroutineScope()

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Assignment") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text("Title *") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                OutlinedTextField(value = courseName, onValueChange = { courseName = it }, label = { Text("Course Name") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                OutlinedTextField(value = dueDate, onValueChange = { dueDate = it }, label = { Text("Due Date (YYYY-MM-DD)") }, modifier = Modifier.fillMaxWidth(), singleLine = true, placeholder = { Text("e.g. 2025-05-15") })
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("assignment", "exam").forEach { t ->
                        FilterChip(selected = type == t, onClick = { type = t }, label = { Text(t.replaceFirstChar { it.uppercase() }) })
                    }
                }
                Text("Priority:", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("low", "medium", "high").forEach { p ->
                        FilterChip(selected = priority == p, onClick = { priority = p }, label = { Text(p.replaceFirstChar { it.uppercase() }) })
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    coroutineScope.launch {
                        try {
                            val userId = SupabaseClient.client.auth.currentUserOrNull()?.id ?: return@launch
                            SupabaseClient.client.from("assignments").insert(
                                mapOf(
                                    "user_id"     to userId,
                                    "title"       to title,
                                    "course_name" to courseName.ifBlank { null },
                                    "due_date"    to dueDate.ifBlank { null },
                                    "type"        to type,
                                    "priority"    to priority,
                                    "status"      to "pending"
                                )
                            )
                            onSaved()
                        } catch (_: Exception) {}
                    }
                },
                enabled = title.isNotBlank()
            ) { Text("Add") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

private fun formatDate(dateStr: String): String {
    return try {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val date = sdf.parse(dateStr.take(10)) ?: return dateStr.take(10)
        SimpleDateFormat("MMM d, yyyy", Locale.getDefault()).format(date)
    } catch (_: Exception) { dateStr.take(10) }
}
