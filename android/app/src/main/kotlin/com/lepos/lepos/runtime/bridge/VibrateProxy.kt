package com.lepos.lepos.runtime.bridge

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.webkit.JavascriptInterface
import com.lepos.lepos.runtime.security.GestureValidator
import org.json.JSONArray

class VibrateProxy(
    private val context: Context,
    private val gestureValidator: GestureValidator
) {
    private val vibrator: Vibrator by lazy {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
    }
    
    @JavascriptInterface
    fun vibrate(patternJson: String): Boolean {
        if (!gestureValidator.hasValidGesture()) {
            return false
        }
        
        return try {
            val pattern = JSONArray(patternJson)
            val timings = LongArray(pattern.length()) { i ->
                pattern.getLong(i)
            }
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createWaveform(timings, -1))
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(timings, -1)
            }
            true
        } catch (e: Exception) {
            false
        }
    }
}
