package com.lepos.lepos.domain.repository

class TokenStorage {
    private val memoryStorage = mutableMapOf<String, String>()

    fun save(key: String, value: String) {
        memoryStorage[key] = value
    }

    fun get(key: String): String? {
        return memoryStorage[key]
    }

    fun remove(key: String) {
        memoryStorage.remove(key)
    }

    fun clear() {
        memoryStorage.clear()
    }
}
