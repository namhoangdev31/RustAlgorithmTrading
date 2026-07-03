import SwiftUI
import UIKit

public struct BrowserShareSheet: UIViewControllerRepresentable {
    public let url: URL
    public let title: String
    
    public init(url: URL, title: String) {
        self.url = url
        self.title = title
    }
    
    public func makeUIViewController(context: Context) -> UIActivityViewController {
        let items: [Any] = [url]
        let controller = UIActivityViewController(activityItems: items, applicationActivities: nil)
        return controller
    }
    
    public func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {
        // No-op
    }
}
