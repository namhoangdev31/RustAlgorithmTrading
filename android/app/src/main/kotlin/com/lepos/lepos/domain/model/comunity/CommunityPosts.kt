package com.lepos.lepos.domain.model.comunity

import kotlin.time.ExperimentalTime
import kotlin.time.Instant

data class CommunityPost @OptIn(ExperimentalTime::class) constructor(
    val id: String,
    val userId: String,
    val content: String,
    val images: List<String>?,
    val hashtags: List<String>?,
    val likeCount: Int,
    val commentCount: Int,
    val createdAt: Instant,
    val updatedAt: Instant,
    val deletedAt: Instant?
)

data class PostLike @OptIn(ExperimentalTime::class) constructor(
    val id: String,
    val postId: String,
    val userId: String,
    val createdAt: Instant
)

data class PostComment @OptIn(ExperimentalTime::class) constructor(
    val id: String,
    val postId: String,
    val userId: String,
    val content: String,
    val parentCommentId: String?,
    val createdAt: Instant,
    val updatedAt: Instant
)
