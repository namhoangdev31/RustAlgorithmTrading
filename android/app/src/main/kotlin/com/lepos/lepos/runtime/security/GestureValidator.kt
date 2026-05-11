package com.lepos.lepos.runtime.security

fun currentTimeMillis(): Long = System.currentTimeMillis()

class GestureValidator(
    private val gestureWindowMs: Long = 5000L // 5 seconds per spec §16.1
) {
    private var lastGestureTimestamp: Long = 0
    
    fun recordGesture() {
        lastGestureTimestamp = currentTimeMillis()
    }
    
    fun hasValidGesture(): Boolean {
        val elapsed = currentTimeMillis() - lastGestureTimestamp
        return elapsed < gestureWindowMs
    }
    
    fun reset() {
        lastGestureTimestamp = 0
    }
}
