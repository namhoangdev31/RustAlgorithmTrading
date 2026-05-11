package com.lepos.lepos.domain.model.news

import kotlin.time.Instant
import kotlin.time.ExperimentalTime

@OptIn(ExperimentalTime::class)
data class NewsCategory(
    val id: String,
    val name: String,
    val slug: String,
    val createdAt: Instant
)

@OptIn(ExperimentalTime::class)
data class NewsArticle(
    val id: String,
    val authorId: String,
    val title: String,
    val content: String,
    val thumbnail: String?,
    val categoryId: String,
    val tags: List<String>?,
    val viewCount: Int,
    val publishedAt: Instant?,
    val createdAt: Instant,
    val updatedAt: Instant,
    val deletedAt: Instant?
)
