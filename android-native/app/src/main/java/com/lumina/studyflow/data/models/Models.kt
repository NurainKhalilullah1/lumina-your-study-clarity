package com.lumina.studyflow.data.models

import kotlinx.serialization.Serializable

@Serializable
data class Profile(
    val id: String,
    val username: String? = null,
    val full_name: String? = null,
    val avatar_url: String? = null,
    val current_streak: Int = 0,
    val total_xp: Int = 0,
    val league: String = "Bronze"
)

@Serializable
data class StudyStat(
    val id: String,
    val user_id: String,
    val event_type: String, // 'quiz_completed', 'pomodoro_session', etc.
    val duration_minutes: Int = 0,
    val created_at: String
)
