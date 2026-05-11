package com.lepos.lepos.domain.model.auth

/**
 * Token Storage Interface
 * Abstract interface for storing and retrieving authentication tokens
 */
interface TokenStorage {
    /**
     * Save a token with the given key
     */
    fun save(key: String, value: String)
    
    /**
     * Retrieve a token by key
     */
    fun get(key: String): String?
    
    /**
     * Remove a token by key
     */
    fun remove(key: String)
    
    /**
     * Get all stored tokens
     */
    fun getAll(): Map<String, String>
    
    /**
     * Clear all tokens
     */
    fun clear()
    
    /**
     * Check if a token exists for a key
     */
    fun contains(key: String): Boolean
}