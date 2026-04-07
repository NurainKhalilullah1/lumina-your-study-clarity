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
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import com.lumina.studyflow.data.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.auth.auth
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

// For demonstration, these would normally be fetched via UseUniversityData hooks mapped natively.
val mockUniversities = listOf("Harvard University", "Stanford University", "MIT", "University of Lagos", "Other")
val mockCourses = listOf("Computer Science", "Mechanical Engineering", "Medicine", "Business Administration", "Law")
val levels = listOf("100 Level", "200 Level", "300 Level", "400 Level", "500 Level", "600 Level")

@OptIn(ExperimentalAnimationApi::class)
@Composable
fun OnboardingScreen(onComplete: () -> Unit) {
    var step by remember { mutableStateOf(0) }
    var university by remember { mutableStateOf("") }
    var customUniversity by remember { mutableStateOf("") }
    var courseOfStudy by remember { mutableStateOf("") }
    var level by remember { mutableStateOf("") }
    
    var uniSearch by remember { mutableStateOf("") }
    var courseSearch by remember { mutableStateOf("") }
    
    var isCreating by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    val selectedUniversity = if (university == "Other") customUniversity else university

    fun completeSignup() {
        coroutineScope.launch {
            isCreating = true
            try {
                val userId = SupabaseClient.client.auth.currentUserOrNull()?.id
                if (userId != null) {
                    // 1. Upsert Profile
                    val userEmail = SupabaseClient.client.auth.currentUserOrNull()?.email
                    SupabaseClient.client.from("profiles").upsert(
                        buildJsonObject {
                            put("id", userId)
                            put("email", userEmail)
                            put("university", selectedUniversity)
                            put("course_of_study", courseOfStudy)
                            put("level", level)
                        }
                    )
                    
                    // 2. Auto-join group via RPC
                    SupabaseClient.client.postgrest.rpc(
                        function = "upsert_user_group",
                        parameters = buildJsonObject {
                            put("p_university", selectedUniversity)
                            put("p_course_of_study", courseOfStudy)
                            put("p_level", level)
                        }
                    )
                    onComplete()
                }
            } catch (e: Exception) {
                snackbarHostState.showSnackbar(e.localizedMessage ?: "Failed to create profile")
            } finally {
                isCreating = false
            }
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentAlignment = Alignment.Center
        ) {
            Card(
                modifier = Modifier
                    .fillMaxWidth(0.9f)
                    .wrapContentHeight(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Progress dots
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(bottom = 24.dp)) {
                        (0..3).forEach { i ->
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .background(
                                        if (i <= step) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                                        CircleShape
                                    )
                            )
                        }
                    }

                    AnimatedContent(
                        targetState = step,
                        transitionSpec = {
                            slideInHorizontally(
                                animationSpec = tween(300),
                                initialOffsetX = { if (targetState > initialState) it else -it }
                            ) with slideOutHorizontally(
                                animationSpec = tween(300),
                                targetOffsetX = { if (targetState > initialState) -it else it }
                            )
                        },
                        label = "onboarding_step"
                    ) { currentStep ->
                        when (currentStep) {
                            0 -> WelcomeStep(
                                onNext = { step = 1 }
                            )
                            1 -> UniversityStep(
                                university = university,
                                customUniversity = customUniversity,
                                uniSearch = uniSearch,
                                onUniversityChange = { university = it },
                                onCustomUniversityChange = { customUniversity = it },
                                onUniSearchChange = { uniSearch = it },
                                onNext = { step = 2 },
                                onBack = { step = 0 }
                            )
                            2 -> CourseStep(
                                courseOfStudy = courseOfStudy,
                                courseSearch = courseSearch,
                                onCourseChange = { courseOfStudy = it },
                                onCourseSearchChange = { courseSearch = it },
                                onNext = { step = 3 },
                                onBack = { step = 1 }
                            )
                            3 -> LevelStep(
                                selectedUniversity = selectedUniversity,
                                courseOfStudy = courseOfStudy,
                                level = level,
                                onLevelChange = { level = it },
                                onComplete = { completeSignup() },
                                onBack = { step = 2 },
                                isCreating = isCreating
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun WelcomeStep(onNext: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(64.dp)
                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Text("✨", fontSize = 32.sp)
        }
        Spacer(modifier = Modifier.height(16.dp))
        Text("Welcome to StudyFlow", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            "Let's set up your account. We'll ask a couple of quick questions to personalize your experience.",
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center
        )
        Spacer(modifier = Modifier.height(24.dp))
        Button(onClick = onNext, modifier = Modifier.fillMaxWidth().height(50.dp)) {
            Text("Get Started")
        }
    }
}

@Composable
private fun UniversityStep(
    university: String, customUniversity: String, uniSearch: String,
    onUniversityChange: (String) -> Unit, onCustomUniversityChange: (String) -> Unit, onUniSearchChange: (String) -> Unit,
    onNext: () -> Unit, onBack: () -> Unit
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text("Select Your University", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
        Spacer(modifier = Modifier.height(16.dp))
        OutlinedTextField(
            value = uniSearch, onValueChange = onUniSearchChange,
            label = { Text("Search universities...") }, modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))
        
        val filtered = mockUniversities.filter { it.contains(uniSearch, ignoreCase = true) }
        LazyColumn(modifier = Modifier.heightIn(max = 150.dp).fillMaxWidth().border(1.dp, MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(8.dp))) {
            items(filtered) { u ->
                val isSelected = university == u
                Text(
                    text = u,
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(if (isSelected) MaterialTheme.colorScheme.primary else Color.Transparent)
                        .clickable { onUniversityChange(u); onUniSearchChange("") }
                        .padding(12.dp),
                    color = if (isSelected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface
                )
            }
        }
        
        AnimatedVisibility(university == "Other") {
            OutlinedTextField(
                value = customUniversity, onValueChange = onCustomUniversityChange,
                label = { Text("Enter your university name") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            OutlinedButton(onClick = onBack, modifier = Modifier.weight(1f).height(50.dp)) { Text("Back") }
            Button(
                onClick = onNext, modifier = Modifier.weight(1f).height(50.dp),
                enabled = university.isNotEmpty() && (university != "Other" || customUniversity.isNotEmpty())
            ) { Text("Next") }
        }
    }
}

@Composable
private fun CourseStep(
    courseOfStudy: String, courseSearch: String,
    onCourseChange: (String) -> Unit, onCourseSearchChange: (String) -> Unit,
    onNext: () -> Unit, onBack: () -> Unit
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text("Your Course of Study", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
        Spacer(modifier = Modifier.height(16.dp))
        OutlinedTextField(
            value = courseSearch, onValueChange = onCourseSearchChange,
            label = { Text("Search courses...") }, modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))
        
        val filtered = mockCourses.filter { it.contains(courseSearch, ignoreCase = true) }
        LazyColumn(modifier = Modifier.heightIn(max = 150.dp).fillMaxWidth().border(1.dp, MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(8.dp))) {
            items(filtered) { c ->
                val isSelected = courseOfStudy == c
                Text(
                    text = c,
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(if (isSelected) MaterialTheme.colorScheme.primary else Color.Transparent)
                        .clickable { onCourseChange(c); onCourseSearchChange("") }
                        .padding(12.dp),
                    color = if (isSelected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            OutlinedButton(onClick = onBack, modifier = Modifier.weight(1f).height(50.dp)) { Text("Back") }
            Button(
                onClick = onNext, modifier = Modifier.weight(1f).height(50.dp),
                enabled = courseOfStudy.isNotEmpty()
            ) { Text("Next") }
        }
    }
}

@Composable
private fun LevelStep(
    selectedUniversity: String, courseOfStudy: String, level: String,
    onLevelChange: (String) -> Unit, onComplete: () -> Unit, onBack: () -> Unit, isCreating: Boolean
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text("Your Academic Level", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
        Spacer(modifier = Modifier.height(16.dp))
        
        // Grid of levels
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            levels.chunked(2).forEach { rowLevels ->
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    rowLevels.forEach { l ->
                        val isSelected = level == l
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .border(1.dp, if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(8.dp))
                                .background(if (isSelected) MaterialTheme.colorScheme.primary.copy(alpha = 0.1f) else Color.Transparent)
                                .clickable { onLevelChange(l) }
                                .padding(12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(l, color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface)
                        }
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        Column(modifier = Modifier.fillMaxWidth().background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(8.dp)).padding(12.dp)) {
            Text("University: $selectedUniversity", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text("Course: $courseOfStudy", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            if (level.isNotEmpty()) Text("Level: $level", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }

        Spacer(modifier = Modifier.height(24.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            OutlinedButton(onClick = onBack, modifier = Modifier.weight(1f).height(50.dp)) { Text("Back") }
            Button(
                onClick = onComplete, modifier = Modifier.weight(1f).height(50.dp),
                enabled = level.isNotEmpty() && !isCreating
            ) {
                if (isCreating) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.onPrimary)
                } else {
                    Text("Complete")
                }
            }
        }
    }
}
