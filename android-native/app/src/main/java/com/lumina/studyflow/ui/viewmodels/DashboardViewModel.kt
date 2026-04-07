package com.lumina.studyflow.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lumina.studyflow.data.models.Profile
import com.lumina.studyflow.data.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class DashboardState(
    val isLoading: Boolean = true,
    val profile: Profile? = null,
    val error: String? = null,
    val quizzesTaken: Int = 0,
    val timeStudiedMinutes: Int = 0
)

class DashboardViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(DashboardState())
    val uiState: StateFlow<DashboardState> = _uiState.asStateFlow()

    init {
        loadDashboardData()
    }

    private fun loadDashboardData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val userId = SupabaseClient.client.auth.currentSessionOrNull()?.user?.id
                    ?: throw Exception("User not authenticated")

                // Fetch Profile
                val profile = SupabaseClient.client.postgrest["profiles"]
                    .select { filter { eq("id", userId) } }
                    .decodeSingleOrNull<Profile>()

                // In a real app we'd fetch actual aggregations here via RPC or count
                // We're stubbing the aggregates for now
                val stubQuizzes = 14
                val stubTime = 120 

                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    profile = profile,
                    quizzesTaken = stubQuizzes,
                    timeStudiedMinutes = stubTime
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.localizedMessage
                )
            }
        }
    }
}
