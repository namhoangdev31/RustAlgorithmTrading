package com.lepos.lepos.runtime.bridge

import android.webkit.WebView
import com.lepos.lepos.runtime.PlatformCapabilities
import com.lepos.lepos.runtime.security.GestureValidator

class AndroidRuntimeBridge(
    private val webView: WebView
) {
    private val gestureValidator = GestureValidator()
    
    fun inject() {
        // 1. Inject capability discovery
        injectCapabilities()
        
        // 2. Register native bridges
        registerNativeBridges()
        
        // 3. Inject proxy implementations
        injectProxies()
        
        // 4. Setup gesture tracking
        setupGestureTracking()
    }
    
    private fun injectCapabilities() {
        val capabilities = PlatformCapabilities.getCapabilities()
        webView.evaluateJavascript(
            """
            window.runtime = {
                capabilities: ${capabilities.toJson()},
                debug: {
                    enableLogs: () => console.log('[Runtime] Debug mode enabled')
                }
            };
            """.trimIndent(),
            null
        )
    }
    
    private fun registerNativeBridges() {
        val context = webView.context
        webView.addJavascriptInterface(
            ShareProxy(context, gestureValidator, webView),
            "NativeShare"
        )
        webView.addJavascriptInterface(
            VibrateProxy(context, gestureValidator),
            "NativeVibrate"
        )
        webView.addJavascriptInterface(
            ClipboardProxy(context, gestureValidator, webView),
            "NativeClipboard"
        )
    }
    
    private fun injectProxies() {
        webView.evaluateJavascript(
            """
            // Override navigator.share
            navigator.share = async (data) => {
                return new Promise((resolve, reject) => {
                    const callbackId = 'share_' + Date.now();
                    window[callbackId + '_resolve'] = resolve;
                    window[callbackId + '_reject'] = reject;
                    NativeShare.share(JSON.stringify(data), callbackId);
                });
            };
            
            // Override navigator.vibrate
            navigator.vibrate = (pattern) => {
                try {
                    const p = Array.isArray(pattern) ? pattern : [pattern];
                    return NativeVibrate.vibrate(JSON.stringify(p));
                } catch (e) {
                    console.error('[Runtime] Vibrate error:', e);
                    return false;
                }
            };
            
            // Override navigator.clipboard.writeText
            if (!navigator.clipboard) {
                navigator.clipboard = {};
            }
            navigator.clipboard.writeText = async (text) => {
                return new Promise((resolve, reject) => {
                    const callbackId = 'clipboard_' + Date.now();
                    window[callbackId + '_resolve'] = resolve;
                    window[callbackId + '_reject'] = reject;
                    NativeClipboard.writeText(text, callbackId);
                });
            };
            """.trimIndent(),
            null
        )
    }
    
    private fun setupGestureTracking() {
        webView.setOnTouchListener { _, event ->
            gestureValidator.recordGesture()
            false // Don't consume the event
        }
    }
}
