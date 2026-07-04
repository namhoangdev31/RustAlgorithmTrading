import SwiftUI
import WebKit

public struct BrowserWebView: UIViewRepresentable {
    public let tabViewModel: BrowserTabViewModel
    
    public init(tabViewModel: BrowserTabViewModel) {
        self.tabViewModel = tabViewModel
    }
    
    public func makeUIView(context: Context) -> WKWebView {
        return tabViewModel.webView
    }
    
    public func updateUIView(_ uiView: WKWebView, context: Context) {
        // No-op. The webview's properties and navigation are controlled entirely 
        // by the BrowserTabViewModel.
    }
}
