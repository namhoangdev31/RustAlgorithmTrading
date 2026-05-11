package com.lepos.lepos.domain.model.chats

import com.lepos.lepos.enum.ChatRoomType
import kotlin.time.ExperimentalTime
import kotlin.time.Instant

data class ChatRoom @OptIn(ExperimentalTime::class) constructor(
    val id: String,
    val type: ChatRoomType,
    val lastMessageAt: Instant?,
    val createdAt: Instant,
    val updatedAt: Instant
)

data class ChatRoomMember @OptIn(ExperimentalTime::class) constructor(
    val id: String,
    val roomId: String,
    val userId: String,
    val unreadCount: Int,
    val createdAt: Instant,
    val updatedAt: Instant
)

data class ChatMessage @OptIn(ExperimentalTime::class) constructor(
    val id: String,
    val roomId: String,
    val senderId: String,
    val content: String,
    val createdAt: Instant
)
