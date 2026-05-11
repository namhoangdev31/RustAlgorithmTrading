package com.lepos.lepos.ui.webruntime

import android.Manifest
import android.app.Activity
import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.webkit.JavascriptInterface
import androidx.annotation.RequiresPermission
import org.json.JSONObject

class AndroidRuntimeBridge(private val context: Context) {
    @RequiresPermission(Manifest.permission.VIBRATE)
    @JavascriptInterface
    fun postMessage(message: String) {
        // Parse JSON message: { action: "haptic", data: {} }
        try {
            val data = JSONObject(message)
            when (data.optString("action")) {
                "vibrate" -> performHaptic()
                "close" -> (context as? Activity)?.finish()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @RequiresPermission(Manifest.permission.VIBRATE)
    private fun performHaptic() {
        val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        vibrator.vibrate(VibrationEffect.createOneShot(50, VibrationEffect.DEFAULT_AMPLITUDE))
    }
}
