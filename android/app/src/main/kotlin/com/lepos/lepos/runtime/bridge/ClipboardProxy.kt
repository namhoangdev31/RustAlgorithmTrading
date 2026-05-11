package com.lepos.lepos.runtime.bridge

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.webkit.WebView
import com.lepos.lepos.runtime.security.GestureValidator

class ClipboardProxy(
    private val context: Context,
    private val gestureValidator: GestureValidator,
    private val webView: WebView
) {
    private val handler = Handler(Looper.getMainLooper())
    private val clipboardManager = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    
    @JavascriptInterface
    fun writeText(text: String, callbackId: String) {
        if (!gestureValidator.hasValidGesture()) {
            rejectWithError(callbackId, "SecurityError", "User gesture required")
            return
        }
        
        try {
            val clip = ClipData.newPlainText("Web Runtime", text)
            clipboardManager.setPrimaryClip(clip)
            resolveCallback(callbackId)
        } catch (e: Exception) {
            rejectWithError(callbackId, "NotAllowedError", "Clipboard access denied")
        }
    }
    
    private fun resolveCallback(callbackId: String) {
        handler.post {
            webView.evaluateJavascript(
                "window['${callbackId}_resolve'] && window['${callbackId}_resolve']()",
                null
            )
        }
    }
    
    private fun rejectWithError(callbackId: String, name: String, message: String) {
        handler.post {
            webView.evaluateJavascript(
                "window['${callbackId}_reject'] && window['${callbackId}_reject'](new DOMException('$message', '$name'))",
                null
            )
        }
    }
}
