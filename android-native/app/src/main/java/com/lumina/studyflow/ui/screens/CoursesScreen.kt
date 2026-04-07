package com.lumina.studyflow.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.School
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
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable

@Serializable
data class Course(
    val id: String = "",
    val user_id: String = "",
    val code: String = "",
    val title: String = "",
    val color: String? = null,
    val created_at: String = ""
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CoursesScreen() {
    var courses by remember { mutableStateOf<List<Course>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var showAddDialog by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    fun loadCourses() {
        coroutineScope.launch {
            isLoading = true
            try {
                val userId = SupabaseClient.client.auth.currentUserOrNull()?.id ?: return@launch
                val result = SupabaseClient.client.from("courses")
                    .select { filter { eq("user_id", userId) } }
                    .decodeList<Course>()
                courses = result
            } catch (e: Exception) {
                snackbarHostState.showSnackbar("Failed to load courses")
            } finally {
                isLoading = false
            }
        }
    }

    fun deleteCourse(courseId: String) {
        coroutineScope.launch {
            try {
                val userId = SupabaseClient.client.auth.currentUserOrNull()?.id ?: return@launch
                SupabaseClient.client.from("courses")
                    .delete { filter { eq("id", courseId); eq("user_id", userId) } }
                loadCourses()
            } catch (e: Exception) {
                snackbarHostState.showSnackbar("Failed to delete course")
            }
        }
    }

    LaunchedEffect(Unit) { loadCourses() }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            FloatingActionButton(onClick = { showAddDialog = true }) {
                Icon(Icons.Filled.Add, contentDescription = "Add Course")
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
                Text("My Courses", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
                Text("Manage your enrolled courses.", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }

            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (courses.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("📚", fontSize = 48.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("No courses yet", fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onBackground)
                        Text("Tap + to add a course", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(courses, key = { it.id }) { course ->
                        CourseCard(course = course, onDelete = { deleteCourse(course.id) })
                    }
                }
            }
        }
    }

    if (showAddDialog) {
        AddCourseDialog(
            onDismiss = { showAddDialog = false },
            onAdded = {
                showAddDialog = false
                loadCourses()
            }
        )
    }
}

@Composable
fun CourseCard(course: Course, onDelete: () -> Unit) {
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
                Icon(Icons.Filled.School, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(course.code, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MaterialTheme.colorScheme.onSurface)
                Text(course.title, fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            IconButton(onClick = onDelete) {
                Icon(Icons.Filled.Delete, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddCourseDialog(onDismiss: () -> Unit, onAdded: () -> Unit) {
    var code by remember { mutableStateOf("") }
    var title by remember { mutableStateOf("") }
    var isSaving by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Course") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = code, onValueChange = { code = it },
                    label = { Text("Course Code (e.g. CS101)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = title, onValueChange = { title = it },
                    label = { Text("Course Title") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (code.isBlank() || title.isBlank()) return@Button
                    isSaving = true
                    coroutineScope.launch {
                        try {
                            val userId = SupabaseClient.client.auth.currentUserOrNull()?.id ?: return@launch
                            SupabaseClient.client.from("courses").insert(
                                mapOf("user_id" to userId, "code" to code.trim(), "title" to title.trim(), "color" to "#6D28D9")
                            )
                            onAdded()
                        } catch (e: Exception) {
                            // handle error
                        } finally {
                            isSaving = false
                        }
                    }
                },
                enabled = code.isNotBlank() && title.isNotBlank() && !isSaving
            ) {
                if (isSaving) {
                    CircularProgressIndicator(modifier = Modifier.size(16.dp), color = MaterialTheme.colorScheme.onPrimary)
                } else {
                    Text("Add")
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !isSaving) { Text("Cancel") }
        }
    )
}
