package com.lumina.studyflow.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lumina.studyflow.data.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.Google
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.compose.auth.composable.rememberSignInWithGoogle
import io.github.jan.supabase.compose.auth.composeAuth
import io.github.jan.supabase.compose.auth.providers.NativeSignInResult
import kotlinx.coroutines.launch

@Composable
fun AuthScreen(onAuthSuccess: () -> Unit) {
    var isLogin          by remember { mutableStateOf(true) }
    var email            by remember { mutableStateOf("") }
    var password         by remember { mutableStateOf("") }
    var confirmPassword  by remember { mutableStateOf("") }
    var showPassword     by remember { mutableStateOf(false) }
    var isLoading        by remember { mutableStateOf(false) }
    var errorMessage     by remember { mutableStateOf<String?>(null) }

    val scrollState   = rememberScrollState()
    val coroutineScope = rememberCoroutineScope()

    // ── Native Google Sign-In via ComposeAuth ──────────────────────────────
    // This correctly handles the One Tap flow and only calls back when complete.
    val googleSignInState = SupabaseClient.client.composeAuth.rememberSignInWithGoogle(
        onResult = { result ->
            when (result) {
                NativeSignInResult.Success -> {
                    onAuthSuccess()
                }
                NativeSignInResult.ClosedByUser -> {
                    // User dismissed — no error shown
                }
                is NativeSignInResult.Error -> {
                    errorMessage = "Google Sign-In failed: ${result.message}"
                    isLoading = false
                }
                is NativeSignInResult.NetworkError -> {
                    errorMessage = "Network error. Please check your connection."
                    isLoading = false
                }
                else -> {}
            }
        }
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
            .verticalScroll(scrollState),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // ── Logo / Branding ──────────────────────────────────────────────
        Box(modifier = Modifier.padding(bottom = 12.dp)) {
            Text("✦", fontSize = 40.sp, color = MaterialTheme.colorScheme.primary)
        }
        Text(
            text = "Lumina",
            fontSize = 32.sp,
            fontWeight = FontWeight.ExtraBold,
            color = MaterialTheme.colorScheme.primary
        )
        Text(
            text = if (isLogin) "Welcome back" else "Create your account",
            fontSize = 15.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(top = 4.dp, bottom = 32.dp)
        )

        // ── Error Banner ─────────────────────────────────────────────────
        AnimatedVisibility(visible = errorMessage != null) {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
            ) {
                Text(
                    errorMessage ?: "",
                    modifier = Modifier.padding(12.dp),
                    color = MaterialTheme.colorScheme.onErrorContainer,
                    fontSize = 13.sp
                )
            }
        }

        // ── Email Field ───────────────────────────────────────────────────
        OutlinedTextField(
            value = email,
            onValueChange = { email = it; errorMessage = null },
            label = { Text("Email address") },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            singleLine = true
        )
        Spacer(modifier = Modifier.height(12.dp))

        // ── Password Field ────────────────────────────────────────────────
        OutlinedTextField(
            value = password,
            onValueChange = { password = it; errorMessage = null },
            label = { Text("Password") },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            singleLine = true,
            visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
            trailingIcon = {
                IconButton(onClick = { showPassword = !showPassword }) {
                    Icon(
                        if (showPassword) Icons.Filled.VisibilityOff else Icons.Filled.Visibility,
                        contentDescription = "Toggle password"
                    )
                }
            }
        )

        // ── Confirm Password (Sign Up only) ────────────────────────────────
        AnimatedVisibility(visible = !isLogin) {
            Column {
                Spacer(modifier = Modifier.height(12.dp))
                OutlinedTextField(
                    value = confirmPassword,
                    onValueChange = { confirmPassword = it; errorMessage = null },
                    label = { Text("Confirm Password") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation()
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // ── Email/Password Submit ─────────────────────────────────────────
        Button(
            onClick = {
                if (!isLogin && password != confirmPassword) {
                    errorMessage = "Passwords don't match"
                    return@Button
                }
                if (email.isBlank() || password.isBlank()) {
                    errorMessage = "Please fill in all fields"
                    return@Button
                }
                isLoading = true
                errorMessage = null
                coroutineScope.launch {
                    try {
                        if (isLogin) {
                            SupabaseClient.client.auth.signInWith(Email) {
                                this.email = email.trim()
                                this.password = password
                            }
                        } else {
                            SupabaseClient.client.auth.signUpWith(Email) {
                                this.email = email.trim()
                                this.password = password
                            }
                        }
                        onAuthSuccess()
                    } catch (e: Exception) {
                        errorMessage = when {
                            e.message?.contains("Invalid login") == true -> "Invalid email or password."
                            e.message?.contains("already registered") == true -> "This email is already registered."
                            e.message?.contains("Password should") == true -> "Password must be at least 6 characters."
                            else -> e.localizedMessage ?: "Authentication failed. Please try again."
                        }
                    } finally {
                        isLoading = false
                    }
                }
            },
            modifier = Modifier.fillMaxWidth().height(56.dp),
            shape = RoundedCornerShape(14.dp),
            enabled = !isLoading && !googleSignInState.isRunning
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    color = MaterialTheme.colorScheme.onPrimary,
                    modifier = Modifier.size(22.dp),
                    strokeWidth = 2.dp
                )
                Spacer(modifier = Modifier.width(10.dp))
            }
            Text(
                text = if (isLogin) "Sign In" else "Create Account",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        // ── Divider ────────────────────────────────────────────────────────
        Row(verticalAlignment = Alignment.CenterVertically) {
            HorizontalDivider(modifier = Modifier.weight(1f))
            Text(
                "  or continue with  ",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 13.sp
            )
            HorizontalDivider(modifier = Modifier.weight(1f))
        }

        Spacer(modifier = Modifier.height(20.dp))

        // ── Google Sign-In Button ─────────────────────────────────────────
        // Uses the rememberSignInWithGoogle state — fires native One Tap in-app
        OutlinedButton(
            onClick = {
                isLoading = false
                errorMessage = null
                googleSignInState.startFlow()
            },
            modifier = Modifier.fillMaxWidth().height(56.dp),
            shape = RoundedCornerShape(14.dp),
            enabled = !isLoading && !googleSignInState.isRunning
        ) {
            if (googleSignInState.isRunning) {
                CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                Spacer(modifier = Modifier.width(10.dp))
            } else {
                Text("G", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                Spacer(modifier = Modifier.width(10.dp))
            }
            Text("Continue with Google", fontSize = 16.sp, fontWeight = FontWeight.Medium)
        }

        Spacer(modifier = Modifier.height(28.dp))

        // ── Toggle Sign In / Sign Up ───────────────────────────────────────
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center
        ) {
            Text(
                text = if (isLogin) "Don't have an account? " else "Already have an account? ",
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = if (isLogin) "Sign Up" else "Sign In",
                color = MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.clickable {
                    isLogin = !isLogin
                    errorMessage = null
                    password = ""
                    confirmPassword = ""
                }
            )
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}
