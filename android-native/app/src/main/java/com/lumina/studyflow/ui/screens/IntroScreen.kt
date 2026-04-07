package com.lumina.studyflow.ui.screens

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch

// ─── Page Data ────────────────────────────────────────────────────────────────
private data class IntroPage(
    val icon: String,
    val title: String,
    val subtitle: String,
    val gradientStart: Color,
    val gradientEnd: Color,
    val accentColor: Color
)

private val INTRO_PAGES = listOf(
    IntroPage(
        icon = "🎓",
        title = "Study Smarter,\nNot Harder",
        subtitle = "AI-powered tools that adapt to your academic journey and help you reach your full potential.",
        gradientStart = Color(0xFF6D28D9),
        gradientEnd   = Color(0xFF4F46E5),
        accentColor   = Color(0xFF8B5CF6)
    ),
    IntroPage(
        icon = "🤖",
        title = "Your Personal\nAI Tutor",
        subtitle = "Ask anything, generate flashcards and quizzes instantly. Study from your own documents.",
        gradientStart = Color(0xFF0F172A),
        gradientEnd   = Color(0xFF1E293B),
        accentColor   = Color(0xFF6D28D9)
    ),
    IntroPage(
        icon = "🏆",
        title = "Earn Rewards,\nStay Motivated",
        subtitle = "Climb leagues, unlock achievements, and beat your daily streak with friends.",
        gradientStart = Color(0xFF064E3B),
        gradientEnd   = Color(0xFF065F46),
        accentColor   = Color(0xFF10B981)
    )
)

// ─── Screen ───────────────────────────────────────────────────────────────────

@OptIn(androidx.compose.foundation.ExperimentalFoundationApi::class)
@Composable
fun IntroScreen(
    onGetStarted: () -> Unit,
    onSignIn: () -> Unit
) {
    val pagerState   = rememberPagerState { INTRO_PAGES.size }
    val coroutineScope = rememberCoroutineScope()
    val isLastPage   = pagerState.currentPage == INTRO_PAGES.size - 1

    Box(modifier = Modifier.fillMaxSize()) {
        // ── Pager ──────────────────────────────────────────────────────────
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxSize()
        ) { pageIdx ->
            val page = INTRO_PAGES[pageIdx]
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(page.gradientStart, page.gradientEnd)
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.padding(horizontal = 36.dp).padding(top = 80.dp, bottom = 200.dp)
                ) {
                    // Icon circle
                    Box(
                        modifier = Modifier
                            .size(130.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.12f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(page.icon, fontSize = 62.sp)
                    }

                    Spacer(modifier = Modifier.height(40.dp))

                    Text(
                        text = page.title,
                        fontSize = 34.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White,
                        textAlign = TextAlign.Center,
                        lineHeight = 42.sp
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    Text(
                        text = page.subtitle,
                        fontSize = 16.sp,
                        color = Color.White.copy(alpha = 0.78f),
                        textAlign = TextAlign.Center,
                        lineHeight = 24.sp
                    )
                }
            }
        }

        // ── Bottom Controls ────────────────────────────────────────────────
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.55f)),
                        startY = 0f, endY = Float.POSITIVE_INFINITY
                    )
                )
                .padding(horizontal = 28.dp, vertical = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Page indicator dots
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                repeat(INTRO_PAGES.size) { idx ->
                    val isActive = pagerState.currentPage == idx
                    val width by animateColorAsState(
                        targetValue = if (isActive) Color.White else Color.White.copy(alpha = 0.35f),
                        animationSpec = tween(250), label = "dot"
                    )
                    Box(
                        modifier = Modifier
                            .height(8.dp)
                            .width(if (isActive) 28.dp else 8.dp)
                            .clip(CircleShape)
                            .background(width)
                            .clickable {
                                coroutineScope.launch { pagerState.animateScrollToPage(idx) }
                            }
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Main action button
            Button(
                onClick = {
                    if (isLastPage) {
                        onGetStarted()
                    } else {
                        coroutineScope.launch {
                            pagerState.animateScrollToPage(pagerState.currentPage + 1)
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.White,
                    contentColor   = INTRO_PAGES[pagerState.currentPage].gradientStart
                )
            ) {
                Text(
                    text = if (isLastPage) "Get Started 🚀" else "Next  →",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.ExtraBold
                )
            }

            // Sign in link
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Already have an account? ", color = Color.White.copy(0.65f), fontSize = 14.sp)
                Text(
                    "Sign In",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    modifier = Modifier.clickable { onSignIn() }
                )
            }
        }
    }
}
