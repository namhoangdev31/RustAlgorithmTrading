package com.lepos.lepos.ui.webruntime

import android.Manifest
import android.app.Activity
import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.annotation.RequiresPermission
import org.json.JSONObject

class AndroidRuntimeBridge(private val context: Context, private val webView: WebView) {
    @RequiresPermission(Manifest.permission.VIBRATE)
    @JavascriptInterface
    fun postMessage(message: String) {
        try {
            val data = JSONObject(message)
            val action = data.optString("action")
            val requestId = data.optString("requestId")
            val payload = data.optJSONObject("payload") ?: JSONObject()
            
            when (action) {
                "vibrate" -> {
                    performHaptic()
                    sendResponse(requestId, JSONObject().put("success", true))
                }
                "close" -> {
                    (context as? Activity)?.finish()
                    sendResponse(requestId, JSONObject().put("success", true))
                }
                "log", "debug.log" -> {
                    val level = payload.optString("level", data.optString("level", "info"))
                    val msg = payload.optString("message", data.optString("message", ""))
                    println("[WebConsole][$level] $msg")
                    sendResponse(requestId, JSONObject().put("success", true))
                }
                "camera.takePhoto", "getCameraPhoto" -> {
                    val res = JSONObject().put("uri", "https://via.placeholder.com/600x400.png?text=NativeCameraPhoto")
                    sendResponse(requestId, res)
                }
                "plugin.invoke" -> {
                    val plugin = payload.optString("plugin", "")
                    val method = payload.optString("method", "")
                    val args = payload.optJSONObject("args") ?: JSONObject()
                    val res = JSONObject()
                        .put("success", true)
                        .put("plugin", plugin)
                        .put("method", method)
                        .put("result", args)
                    sendResponse(requestId, res)
                }
                "hotReload" -> {
                    println("[WebRuntime] Hot reload message received: $payload")
                    sendResponse(requestId, JSONObject().put("success", true))
                }
                else -> {
                    sendResponse(requestId, JSONObject().put("success", true))
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun sendResponse(requestId: String, responseData: JSONObject?, error: String? = null) {
        if (requestId.isEmpty()) return
        val response = JSONObject()
        responseData?.let { response.put("data", it) }
        error?.let { response.put("error", it) }
        
        webView.post {
            webView.evaluateJavascript(
                "window.__lepoShipReceiveMessage('$requestId', $response)",
                null
            )
        }
    }

    @RequiresPermission(Manifest.permission.VIBRATE)
    private fun performHaptic() {
        val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(50, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(50)
        }
    }
}
