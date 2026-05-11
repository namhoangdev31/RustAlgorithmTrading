package com.lepos.lepos.runtime.bridge

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.webkit.WebView
import com.lepos.lepos.runtime.security.GestureValidator
import org.json.JSONObject

class ShareProxy(
    private val context: Context,
    private val gestureValidator: GestureValidator,
    private val webView: WebView
) {
    private val handler = Handler(Looper.getMainLooper())
    
    @JavascriptInterface
    fun share(dataJson: String, callbackId: String) {
        // Validate user gesture per §16.1
        if (!gestureValidator.hasValidGesture()) {
            rejectWithError(callbackId, "SecurityError", "User gesture required")
            return
        }
        
        try {
            val data = JSONObject(dataJson)
            val text = data.optString("text", "")
            val title = data.optString("title", "")
            val url = data.optString("url", "")
            
            val shareContent = buildString {
                if (title.isNotEmpty()) append("$title\n\n")
                if (text.isNotEmpty()) append("$text\n\n")
                if (url.isNotEmpty()) append(url)
            }
            
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_TEXT, shareContent)
                if (title.isNotEmpty()) {
                    putExtra(Intent.EXTRA_SUBJECT, title)
                }
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            
            val activity = context as? Activity
            activity?.startActivity(Intent.createChooser(intent, "Share via"))
            
            // Resolve promise
            resolveCallback(callbackId)
            
        } catch (e: Exception) {
            rejectWithError(callbackId, "AbortError", "Share failed: ${e.message}")
        }
    }
    
    private fun resolveCallback(callbackId: String) {
        handler.post {
            webView.evaluateJavascript(
                """
                if (window['${callbackId}_resolve']) {
                    window['${callbackId}_resolve']();
                    delete window['${callbackId}_resolve'];
                    delete window['${callbackId}_reject'];
                }
                """.trimIndent(),
                null
            )
        }
    }
    
    private fun rejectWithError(callbackId: String, name: String, message: String) {
        handler.post {
            webView.evaluateJavascript(
                """
                if (window['${callbackId}_reject']) {
                    window['${callbackId}_reject'](new DOMException('$message', '$name'));
                    delete window['${callbackId}_resolve'];
                    delete window['${callbackId}_reject'];
                }
                """.trimIndent(),
                null
            )
        }
    }
}
