package com.lumina.studyflow.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lumina.studyflow.data.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Order
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

// ─── Models ───────────────────────────────────────────────────────────────────

@Serializable
data class CommunityPost(
    val id: String,
    val user_id: String,
    val content: String,
    val category: String = "discussion",
    val upvote_count: Int = 0,
    val comment_count: Int = 0,
    val created_at: String = "",
    val author_name: String? = null
)

@Serializable
data class PostComment(
    val id: String = "",
    val post_id: String = "",
    val user_id: String = "",
    val content: String = "",
    val created_at: String = ""
    // Note: author_name is not a DB column — fetched via profile join if needed
)

@Serializable
data class PostUpvote(
    val id: String = "",
    val post_id: String = "",
    val user_id: String = ""
)

// ─── Screen ───────────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CommunityScreen() {
    val coroutineScope     = rememberCoroutineScope()
    val snackbarHostState  = remember { SnackbarHostState() }

    var posts              by remember { mutableStateOf<List<CommunityPost>>(emptyList()) }
    var isLoading          by remember { mutableStateOf(true) }
    var isRefreshing       by remember { mutableStateOf(false) }
    var search             by remember { mutableStateOf("") }
    var selectedCategory   by remember { mutableStateOf("all") }
    var tab                by remember { mutableStateOf(0) }
    var showCreateDialog   by remember { mutableStateOf(false) }
    var commentPost        by remember { mutableStateOf<CommunityPost?>(null) }

    // Which posts the current user has upvoted
    var myUpvotedIds       by remember { mutableStateOf<Set<String>>(emptySet()) }
    // Optimistic local upvote count overrides
    var localCounts        by remember { mutableStateOf<Map<String, Int>>(emptyMap()) }

    val currentUserId = remember { mutableStateOf<String?>(null) }
    val categories = listOf("all", "question", "tip", "discussion", "achievement")

    // ── Data loading ────────────────────────────────────────────────────────
    suspend fun fetchPosts() {
        val result = SupabaseClient.client.from("community_posts")
            .select { order("created_at", Order.DESCENDING) }
            .decodeList<CommunityPost>()
        posts = result
        localCounts = emptyMap()
        // Note: author_name is loaded separately — use profiles join in future enhancement
    }

    suspend fun fetchMyUpvotes(userId: String) {
        val rows = SupabaseClient.client.from("community_upvotes")
            .select { filter { eq("user_id", userId) } }
            .decodeList<PostUpvote>()
        myUpvotedIds = rows.map { it.post_id }.toSet()
    }

    fun loadAll() {
        coroutineScope.launch {
            isLoading = true
            try {
                val userId = SupabaseClient.client.auth.currentUserOrNull()?.id
                currentUserId.value = userId
                fetchPosts()
                if (userId != null) fetchMyUpvotes(userId)
            } catch (e: Exception) {
                snackbarHostState.showSnackbar("Failed to load: ${e.localizedMessage}")
            } finally {
                isLoading = false
            }
        }
    }

    fun refresh() {
        coroutineScope.launch {
            isRefreshing = true
            try {
                val userId = currentUserId.value
                fetchPosts()
                if (userId != null) fetchMyUpvotes(userId)
            } catch (_: Exception) {
            } finally {
                isRefreshing = false
            }
        }
    }

    // ── Upvote toggle ────────────────────────────────────────────────────────
    fun toggleUpvote(post: CommunityPost) {
        val userId = currentUserId.value ?: return
        val postId = post.id
        val alreadyLiked = postId in myUpvotedIds
        // Optimistic update
        val base = localCounts[postId] ?: post.upvote_count
        localCounts = localCounts + (postId to if (alreadyLiked) (base - 1).coerceAtLeast(0) else base + 1)
        myUpvotedIds = if (alreadyLiked) myUpvotedIds - postId else myUpvotedIds + postId

        coroutineScope.launch {
            try {
                if (alreadyLiked) {
                    SupabaseClient.client.from("community_upvotes")
                        .delete { filter { eq("post_id", postId); eq("user_id", userId) } }
                    SupabaseClient.client.from("community_posts")
                        .update(mapOf("upvote_count" to localCounts[postId])) { filter { eq("id", postId) } }
                } else {
                    SupabaseClient.client.from("community_upvotes").insert(mapOf("post_id" to postId, "user_id" to userId))
                    SupabaseClient.client.from("community_posts")
                        .update(mapOf("upvote_count" to localCounts[postId])) { filter { eq("id", postId) } }
                }
            } catch (_: Exception) {
                // Revert optimistic update on error
                localCounts = localCounts - postId
                myUpvotedIds = if (alreadyLiked) myUpvotedIds + postId else myUpvotedIds - postId
            }
        }
    }

    LaunchedEffect(Unit) { loadAll() }

    // ── Filter ───────────────────────────────────────────────────────────────
    val filtered = posts.filter { post ->
        val matchCat    = selectedCategory == "all" || post.category == selectedCategory
        val matchSearch = search.isEmpty() || post.content.contains(search, ignoreCase = true) ||
                          (post.author_name?.contains(search, ignoreCase = true) == true)
        matchCat && matchSearch
    }

    val pullState = rememberPullToRefreshState()

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { showCreateDialog = true },
                icon = { Icon(Icons.Filled.Edit, null) },
                text = { Text("New Post", fontWeight = FontWeight.SemiBold) }
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->

        PullToRefreshBox(
            isRefreshing = isRefreshing,
            onRefresh = { refresh() },
            state = pullState,
            modifier = Modifier.fillMaxSize().padding(padding)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // ── Header ──────────────────────────────────────────────────
                Column(modifier = Modifier.padding(horizontal = 18.dp, vertical = 14.dp)) {
                    Text("Community", fontSize = 28.sp, fontWeight = FontWeight.Bold)
                    Text("Ask questions, share tips, connect with fellow students.", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }

                // ── Search ───────────────────────────────────────────────────
                OutlinedTextField(
                    value = search, onValueChange = { search = it },
                    placeholder = { Text("Search posts…") },
                    leadingIcon = { Icon(Icons.Filled.Search, null) },
                    trailingIcon = {
                        if (search.isNotEmpty()) IconButton(onClick = { search = "" }) { Icon(Icons.Filled.Clear, null, modifier = Modifier.size(18.dp)) }
                    },
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                    shape = RoundedCornerShape(14.dp),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = MaterialTheme.colorScheme.primary)
                )

                Spacer(modifier = Modifier.height(10.dp))

                // ── Category chips ───────────────────────────────────────────
                Row(
                    modifier = Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    categories.forEach { cat ->
                        val catIcon = when (cat) {
                            "question"    -> "❓"
                            "tip"         -> "💡"
                            "achievement" -> "🏆"
                            "discussion"  -> "💬"
                            else          -> "✨"
                        }
                        FilterChip(
                            selected = selectedCategory == cat,
                            onClick = { selectedCategory = cat },
                            label = { Text("$catIcon ${cat.replaceFirstChar { it.uppercase() }}") }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))

                // ── Tabs ─────────────────────────────────────────────────────
                TabRow(selectedTabIndex = tab) {
                    Tab(selected = tab == 0, onClick = { tab = 0 }, text = { Text("All Posts") })
                    Tab(selected = tab == 1, onClick = { tab = 1 }, text = { Text("My Group") })
                }

                // ── Feed ─────────────────────────────────────────────────────
                if (isLoading) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                } else if (filtered.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("💬", fontSize = 52.sp)
                            Spacer(modifier = Modifier.height(10.dp))
                            Text("No posts yet", fontWeight = FontWeight.SemiBold, fontSize = 18.sp)
                            Text("Be the first to share something!", color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                } else {
                    LazyColumn(
                        state = rememberLazyListState(),
                        contentPadding = PaddingValues(16.dp, 12.dp, 16.dp, 96.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(filtered, key = { it.id }) { post ->
                            PostCard(
                                post = post,
                                isLiked = post.id in myUpvotedIds,
                                displayCount = localCounts[post.id] ?: post.upvote_count,
                                onLike = { toggleUpvote(post) },
                                onComment = { commentPost = post }
                            )
                        }
                    }
                }
            }
        }
    }

    // ── Create Post Dialog ───────────────────────────────────────────────────
    if (showCreateDialog) {
        CreatePostDialog(
            onDismiss = { showCreateDialog = false },
            onPosted  = { showCreateDialog = false; refresh() }
        )
    }

    // ── Comment Sheet ────────────────────────────────────────────────────────
    commentPost?.let { post ->
        CommentSheet(
            post = post,
            currentUserId = currentUserId.value,
            onDismiss = { commentPost = null; refresh() }
        )
    }
}

// ─── PostCard ─────────────────────────────────────────────────────────────────
@Composable
fun PostCard(
    post: CommunityPost,
    isLiked: Boolean,
    displayCount: Int,
    onLike: () -> Unit,
    onComment: () -> Unit
) {
    val categoryColor = when (post.category) {
        "question"    -> MaterialTheme.colorScheme.tertiary
        "tip"         -> Color(0xFF22C55E)
        "achievement" -> Color(0xFFF59E0B)
        else          -> MaterialTheme.colorScheme.primary
    }
    val catIcon = when (post.category) {
        "question"    -> "❓"
        "tip"         -> "💡"
        "achievement" -> "🏆"
        else          -> "💬"
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Author row
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier.size(40.dp).clip(CircleShape)
                        .background(categoryColor.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        (post.author_name?.firstOrNull() ?: "?").toString().uppercase(),
                        fontWeight = FontWeight.Bold, color = categoryColor, fontSize = 16.sp
                    )
                }
                Spacer(modifier = Modifier.width(10.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(post.author_name ?: "Anonymous", fontWeight = FontWeight.SemiBold, fontSize = 14.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(formatRelativeTime(post.created_at), fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                // Category badge
                Box(
                    modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(categoryColor.copy(0.1f)).padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text("$catIcon ${post.category.replaceFirstChar { it.uppercase() }}", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = categoryColor)
                }
            }

            Spacer(modifier = Modifier.height(12.dp))
            Text(post.content, fontSize = 15.sp, color = MaterialTheme.colorScheme.onSurface, lineHeight = 22.sp)
            Spacer(modifier = Modifier.height(14.dp))

            // Actions row
            Row(horizontalArrangement = Arrangement.spacedBy(20.dp), verticalAlignment = Alignment.CenterVertically) {
                // Upvote button
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (isLiked) MaterialTheme.colorScheme.primary.copy(0.1f) else Color.Transparent)
                        .clickable { onLike() }
                        .padding(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    AnimatedContent(targetState = isLiked, label = "heart") { liked ->
                        Icon(
                            if (liked) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                            null,
                            modifier = Modifier.size(18.dp),
                            tint = if (liked) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Spacer(modifier = Modifier.width(5.dp))
                    AnimatedContent(targetState = displayCount, label = "count") { cnt ->
                        Text("$cnt", fontSize = 13.sp, fontWeight = FontWeight.SemiBold,
                            color = if (isLiked) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }

                // Comment button
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .clickable { onComment() }
                        .padding(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Icon(Icons.Filled.Comment, null, modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.width(5.dp))
                    Text("${post.comment_count}", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, fontWeight = FontWeight.SemiBold)
                }

                Spacer(modifier = Modifier.weight(1f))
                Text("Reply", fontSize = 13.sp, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.clickable { onComment() })
            }
        }
    }
}

// ─── Comment Bottom Sheet ─────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CommentSheet(
    post: CommunityPost,
    currentUserId: String?,
    onDismiss: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    var comments by remember { mutableStateOf<List<PostComment>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var newComment by remember { mutableStateOf("") }
    var isSending by remember { mutableStateOf(false) }
    val listState = rememberLazyListState()

    LaunchedEffect(post.id) {
        isLoading = true
        try {
            comments = SupabaseClient.client.from("community_comments")
                .select { filter { eq("post_id", post.id) }; order("created_at", Order.ASCENDING) }
                .decodeList<PostComment>()
        } catch (e: Exception) {
            snackbarHostState.showSnackbar("Failed to load comments")
        } finally {
            isLoading = false
        }
    }

    // Auto-scroll to bottom when comments load
    LaunchedEffect(comments.size) {
        if (comments.isNotEmpty()) listState.animateScrollToItem(comments.size - 1)
    }

    fun sendComment() {
        if (newComment.isBlank() || currentUserId == null) return
        isSending = true
        val text = newComment.trim()
        newComment = ""
        coroutineScope.launch {
            try {
                val saved = SupabaseClient.client.from("community_comments").insert(
                    mapOf("post_id" to post.id, "user_id" to currentUserId, "content" to text)
                ) { select() }.decodeSingleOrNull<PostComment>()
                if (saved != null) {
                    comments = comments + saved
                    // Bump comment count on post
                    SupabaseClient.client.from("community_posts")
                        .update(mapOf("comment_count" to (post.comment_count + comments.size))) {
                            filter { eq("id", post.id) }
                        }
                }
            } catch (e: Exception) {
                snackbarHostState.showSnackbar("Failed to post: ${e.localizedMessage}")
            } finally {
                isSending = false
            }
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        dragHandle = { BottomSheetDefaults.DragHandle() }
    ) {
        Column(modifier = Modifier.fillMaxHeight(0.85f).fillMaxWidth()) {
            // Sheet header
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Comments", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                Text("${comments.size}", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(MaterialTheme.colorScheme.surfaceVariant).padding(horizontal = 8.dp, vertical = 4.dp))
            }

            // Original post summary
            Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Text(post.content, modifier = Modifier.padding(12.dp), fontSize = 13.sp, maxLines = 2, overflow = TextOverflow.Ellipsis, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }

            HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

            // Comments list
            if (isLoading) {
                Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
            } else if (comments.isEmpty()) {
                Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("💬", fontSize = 40.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("No comments yet", fontWeight = FontWeight.SemiBold)
                        Text("Be the first to reply!", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 13.sp)
                    }
                }
            } else {
                LazyColumn(
                    state = listState,
                    modifier = Modifier.weight(1f).fillMaxWidth(),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(comments, key = { it.id }) { comment ->
                        CommentBubble(comment = comment, isOwn = comment.user_id == currentUserId)
                    }
                }
            }

            // Input row
            Surface(color = MaterialTheme.colorScheme.surface, tonalElevation = 4.dp) {
                Row(
                    modifier = Modifier.padding(12.dp, 8.dp, 12.dp, 24.dp).fillMaxWidth(),
                    verticalAlignment = Alignment.Bottom
                ) {
                    OutlinedTextField(
                        value = newComment,
                        onValueChange = { newComment = it },
                        placeholder = { Text("Add a comment…") },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(20.dp),
                        maxLines = 3,
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = MaterialTheme.colorScheme.primary)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Box(
                        modifier = Modifier.size(46.dp).clip(CircleShape)
                            .background(if (newComment.isNotBlank()) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant)
                            .clickable(enabled = newComment.isNotBlank() && !isSending) { sendComment() },
                        contentAlignment = Alignment.Center
                    ) {
                        if (isSending) {
                            CircularProgressIndicator(modifier = Modifier.size(18.dp),
                                color = MaterialTheme.colorScheme.onPrimary, strokeWidth = 2.dp)
                        } else {
                            Icon(Icons.Filled.Send, null, modifier = Modifier.size(20.dp),
                                tint = if (newComment.isNotBlank()) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }
        }
    }
}

// ─── Comment Bubble ───────────────────────────────────────────────────────────
@Composable
private fun CommentBubble(comment: PostComment, isOwn: Boolean) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isOwn) Arrangement.End else Arrangement.Start
    ) {
        if (!isOwn) {
            Box(
                modifier = Modifier.size(34.dp).clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primary.copy(0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Text("?", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary, fontSize = 13.sp)
            }
            Spacer(modifier = Modifier.width(8.dp))
        }
        Column(horizontalAlignment = if (isOwn) Alignment.End else Alignment.Start) {
            if (!isOwn) {
                Text("User", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(bottom = 3.dp))
            }
            Surface(
                shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp, bottomStart = if (isOwn) 16.dp else 4.dp, bottomEnd = if (isOwn) 4.dp else 16.dp),
                color = if (isOwn) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                modifier = Modifier.widthIn(max = 280.dp)
            ) {
                Text(comment.content, modifier = Modifier.padding(12.dp, 10.dp), fontSize = 14.sp,
                    color = if (isOwn) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface)
            }
            Text(formatRelativeTime(comment.created_at), fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 3.dp, start = if (!isOwn) 4.dp else 0.dp))
        }
    }
}

// ─── Create Post Dialog ───────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreatePostDialog(onDismiss: () -> Unit, onPosted: () -> Unit) {
    var content  by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("discussion") }
    val coroutineScope = rememberCoroutineScope()
    val categories = listOf("question", "tip", "discussion", "achievement")
    val catIcons   = mapOf("question" to "❓", "tip" to "💡", "discussion" to "💬", "achievement" to "🏆")

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create Post", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                OutlinedTextField(
                    value = content, onValueChange = { content = it },
                    label = { Text("What's on your mind? *") },
                    modifier = Modifier.fillMaxWidth().height(130.dp),
                    shape = RoundedCornerShape(14.dp), maxLines = 6
                )
                Column {
                    Text("Category", fontSize = 13.sp, fontWeight = FontWeight.Medium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.horizontalScroll(rememberScrollState())) {
                        categories.forEach { cat ->
                            FilterChip(
                                selected = category == cat,
                                onClick = { category = cat },
                                label = { Text("${catIcons[cat]} ${cat.replaceFirstChar { it.uppercase() }}") }
                            )
                        }
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
                            SupabaseClient.client.from("community_posts").insert(
                                mapOf("user_id" to userId, "content" to content.trim(), "category" to category)
                            )
                            onPosted()
                        } catch (_: Exception) {}
                    }
                },
                enabled = content.isNotBlank()
            ) { Text("Post 📤") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
private fun formatRelativeTime(isoString: String): String {
    return try {
        val instant  = Instant.parse(isoString)
        val seconds  = Instant.now().epochSecond - instant.epochSecond
        when {
            seconds < 60      -> "just now"
            seconds < 3600    -> "${seconds / 60}m ago"
            seconds < 86400   -> "${seconds / 3600}h ago"
            seconds < 604800  -> "${seconds / 86400}d ago"
            else -> DateTimeFormatter.ofPattern("MMM d", Locale.getDefault())
                        .withZone(ZoneId.systemDefault()).format(instant)
        }
    } catch (_: Exception) { "" }
}
