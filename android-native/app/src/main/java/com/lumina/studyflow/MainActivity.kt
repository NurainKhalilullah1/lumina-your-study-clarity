package com.lumina.studyflow

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.lumina.studyflow.ui.StudyFlowApp
import com.lumina.studyflow.ui.theme.StudyFlowTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // Install the OS-level splash screen BEFORE super.onCreate
        // This shows a purple branded screen while the app initialises
        installSplashScreen()

        super.onCreate(savedInstanceState)
        setContent {
            StudyFlowTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    StudyFlowApp()
                }
            }
        }
    }
}
