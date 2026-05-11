package com.lepos.lepos.ui.webruntime

import android.annotation.SuppressLint
import android.content.Context
import android.view.ViewGroup
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import com.lepos.lepos.runtime.RuntimeInjector
import com.lepos.lepos.domain.model.RuntimeType
import com.lepos.lepos.domain.model.WebRuntimeManifest

@SuppressLint("SetJavaScriptEnabled", "ViewConstructor")
class RuntimeWebView(context: Context) : WebView(context) {

    init {
        // 1. Full Screen Layout Params
        layoutParams = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        )

        // 2. Critical WebSettings for SPA
        settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            useWideViewPort = true
            loadWithOverviewMode = true
            mediaPlaybackRequiresUserGesture = false
            
            // Allow File Access for local bundles
            allowFileAccess = true
            allowContentAccess = true
            allowFileAccessFromFileURLs = true
            allowUniversalAccessFromFileURLs = true
            
            // Disable Zoom
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
        }

        // 3. UI Tweaks (No Scrollbars, No Over-scroll)
        isVerticalScrollBarEnabled = false
        isHorizontalScrollBarEnabled = false
        overScrollMode = OVER_SCROLL_NEVER
        
        // 4. Bridge Injection
        addJavascriptInterface(AndroidRuntimeBridge(context), "LeposBridge")

        // 5. WebChromeClient for Console
        webChromeClient = object : android.webkit.WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: android.webkit.ConsoleMessage?): Boolean {
                consoleMessage?.let {
                    android.util.Log.i("WebRuntime", "${it.message()} -- ${it.lineNumber()}")
                }
                return true
            }
        }
    }

    fun loadBundle(manifest: WebRuntimeManifest, httpUrl: String) {
        webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                injectCss(manifest)
            }
        }
        loadUrl(httpUrl)
    }

    private fun injectCss(manifest: WebRuntimeManifest) {
        if (manifest.type == RuntimeType.STANDARD) {
            val css = RuntimeInjector.getCssInjection(manifest.type)
                .replace("\n", " ")
                .replace("\n", " ")
                .replace("  ", "") + " * { -webkit-tap-highlight-color: rgba(0,0,0,0); }"
            
            val js = """
                (function() {
                    var style = document.createElement('style');
                    style.textContent = '$css';
                    document.head.appendChild(style);
                })();
            """.trimIndent()
            evaluateJavascript(js, null)
        }
    }
}
