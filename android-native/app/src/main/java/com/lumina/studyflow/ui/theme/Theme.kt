package com.lumina.studyflow.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF6168F8),
    onPrimary = Color(0xFFFFFFFF),
    secondary = Color(0xFF5D26D9), // accent
    onSecondary = Color(0xFFFFFFFF),
    background = Color(0xFF080B16),
    onBackground = Color(0xFFF5F7FA),
    surface = Color(0xFF111425),
    onSurface = Color(0xFFF5F7FA),
    surfaceVariant = Color(0xFF1C223A),
    onSurfaceVariant = Color(0xFFA1A1AA) // muted foreground
)

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF474DF2),
    onPrimary = Color(0xFFFFFFFF),
    secondary = Color(0xFFF76B15), // accent
    onSecondary = Color(0xFFFFFFFF),
    background = Color(0xFFF5F7FA),
    onBackground = Color(0xFF141438),
    surface = Color(0xFFFFFFFF),
    onSurface = Color(0xFF141438),
    surfaceVariant = Color(0xFFE4E9F2),
    onSurfaceVariant = Color(0xFF71717A) // muted foreground
)

@Composable
fun StudyFlowTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.primary.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
