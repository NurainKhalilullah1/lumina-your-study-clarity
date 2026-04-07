package com.lumina.studyflow.data.supabase

import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.functions.Functions
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.realtime.Realtime
import io.github.jan.supabase.compose.auth.ComposeAuth
import io.github.jan.supabase.compose.auth.googleNativeLogin

object SupabaseClient {
    private const val SUPABASE_URL = "https://qecpaduxewgnumrjrroo.supabase.co"
    private const val SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlY3BhZHV4ZXdnbnVtcmpycm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODkwNzIsImV4cCI6MjA4MzI2NTA3Mn0.7pVxkUZDlhXHfvI1yqRi6X_GtLIPo78occhww6khmSM"

    // ⚠️  This MUST be the WEB OAuth 2.0 Client ID from Google Cloud Console,
    //     NOT the Android client ID. Find it at:
    //     console.cloud.google.com → APIs & Services → Credentials → Web application client
    private const val GOOGLE_WEB_CLIENT_ID =
        "1048055478088-8rc0hh9t2ihbpdrmmcppe4hak2qrufn2.apps.googleusercontent.com"

    val client = createSupabaseClient(
        supabaseUrl = SUPABASE_URL,
        supabaseKey = SUPABASE_KEY
    ) {
        install(Postgrest)
        install(Auth)
        install(Functions)   // ← Required for gemini-chat Edge Function calls
        install(Realtime)    // ← Required for live community feed
        install(ComposeAuth) {
            googleNativeLogin(serverClientId = GOOGLE_WEB_CLIENT_ID)
        }
    }
}
