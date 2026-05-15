import SwiftUI

#if canImport(UIKit)
import UIKit
#endif

#if canImport(AppKit)
import AppKit
#endif

// MARK: - Adaptive Link

/// A control for navigating to a URL with a graceful fallback for iOS 13.
public struct AdaptiveLink<Label: View>: View {
    let url: URL
    let label: () -> Label
    
    public init(destination: URL, @ViewBuilder label: @escaping () -> Label) {
        self.url = destination
        self.label = label
    }
    
    public init(_ titleKey: LocalizedStringKey, destination: URL) where Label == Text {
        self.url = destination
        self.label = { Text(titleKey) }
    }
    
    public init<S: StringProtocol>(_ title: S, destination: URL) where Label == Text {
        self.url = destination
        self.label = { Text(title) }
    }
    
    public var body: some View {
        #if os(iOS) || os(macOS) || os(tvOS) || os(visionOS) || os(watchOS)
        if #available(iOS 14.0, macOS 11.0, tvOS 14.0, watchOS 7.0, visionOS 1.0, *) {
            Link(destination: url, label: label)
        } else {
            Button(action: openURL) {
                label()
            }
        }
        #else
        Button(action: openURL) {
            label()
        }
        #endif
    }
    
    private func openURL() {
        #if canImport(UIKit) && !os(watchOS)
        UIApplication.shared.open(url)
        #elseif canImport(AppKit)
        NSWorkspace.shared.open(url)
        #endif
    }
}

// MARK: - Adaptive ShareLink

public struct AdaptiveSharePreview: Sendable {
    public let title: String
    public let image: Image?
    
    public init(_ title: String, image: Image? = nil) {
        self.title = title
        self.image = image
    }
}

/// A view that controls a sharing presentation. Falls back to `UIActivityViewController` on older iOS versions.
public struct AdaptiveShareLink<Label: View>: View {
    let url: URL
    let subject: Text?
    let message: Text?
    let preview: AdaptiveSharePreview?
    let label: () -> Label
    
    @State private var isSharePresented = false
    
    public init(item: URL, subject: Text? = nil, message: Text? = nil, preview: AdaptiveSharePreview? = nil, @ViewBuilder label: @escaping () -> Label) {
        self.url = item
        self.subject = subject
        self.message = message
        self.preview = preview
        self.label = label
    }
    
    public init(_ titleKey: LocalizedStringKey, item: URL) where Label == Text {
        self.url = item
        self.subject = nil
        self.message = nil
        self.preview = nil
        self.label = { Text(titleKey) }
    }
    
    public var body: some View {
        #if os(iOS) || os(macOS) || os(visionOS) || os(watchOS)
        if #available(iOS 16.0, macOS 13.0, watchOS 9.0, visionOS 1.0, *) {
            if let adaptivePreview = preview {
                let sharePreview = SharePreview(adaptivePreview.title, image: adaptivePreview.image ?? Image(systemName: "photo"))
                ShareLink(item: url, subject: subject, message: message, preview: sharePreview, label: label)
            } else {
                ShareLink(item: url, subject: subject, message: message, label: label)
            }
        } else {
            fallbackButton
        }
        #else
        fallbackButton
        #endif
    }
    
    private var fallbackButton: some View {
        Button(action: {
            #if os(iOS) || os(visionOS)
            isSharePresented = true
            #elseif os(macOS)
            // macOS fallback using NSSharingServicePicker
            #if canImport(AppKit)
            let picker = NSSharingServicePicker(items: [url])
            picker.show(relativeTo: .zero, of: NSApp.keyWindow!.contentView!, preferredEdge: .minY)
            #endif
            #endif
        }) {
            label()
        }
        #if os(iOS) || os(visionOS)
        .sheet(isPresented: $isSharePresented) {
            ActivityView(activityItems: [url])
        }
        #endif
    }
}

#if os(iOS) || os(visionOS)
private struct ActivityView: UIViewControllerRepresentable {
    let activityItems: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
#endif

// MARK: - Adaptive HelpLink

/// A button that opens app-specific help documentation. Uses native macOS `HelpLink` when available.
public struct AdaptiveHelpLink<Label: View>: View {
    let action: () -> Void
    let label: () -> Label
    
    public init(action: @escaping () -> Void, @ViewBuilder label: @escaping () -> Label) {
        self.action = action
        self.label = label
    }
    
    public init(action: @escaping () -> Void) where Label == Image {
        self.action = action
        self.label = { Image(systemName: "questionmark.circle") }
    }
    
    public var body: some View {
        #if os(macOS)
        if #available(macOS 14.0, *) {
            HelpLink(action: action)
        } else {
            Button(action: action) { label() }
        }
        #else
        Button(action: action) { label() }
        #endif
    }
}

// MARK: - Adaptive TextFieldLink

/// A control that requests text input from the user when pressed. Polyfills watchOS `TextFieldLink` to iOS via sheets.
public struct AdaptiveTextFieldLink<Label: View>: View {
    let title: String
    let prompt: Text?
    let onSubmit: (String) -> Void
    let label: () -> Label
    
    @State private var isPresented = false
    @State private var text = ""
    
    public init(_ title: String, prompt: Text? = nil, onSubmit: @escaping (String) -> Void, @ViewBuilder label: @escaping () -> Label) {
        self.title = title
        self.prompt = prompt
        self.onSubmit = onSubmit
        self.label = label
    }
    
    public init(_ title: String, prompt: Text? = nil, onSubmit: @escaping (String) -> Void) where Label == Text {
        self.title = title
        self.prompt = prompt
        self.onSubmit = onSubmit
        self.label = { Text(title) }
    }
    
    public var body: some View {
        #if os(watchOS)
        if #available(watchOS 9.0, *) {
            TextFieldLink(title, prompt: prompt) { str in
                onSubmit(str)
            } label: {
                label()
            }
        } else {
            fallbackButton
        }
        #else
        fallbackButton
        #endif
    }
    
    private var fallbackButton: some View {
        Button {
            isPresented = true
        } label: {
            label()
        }
        .sheet(isPresented: $isPresented) {
            #if os(iOS) || os(macOS) || os(tvOS) || os(visionOS)
            NavigationView {
                Form {
                    TextField(title, text: $text)
                }
                .navigationTitle(title)
                #if os(iOS) || os(macOS)
                .toolbar {
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Done") {
                            onSubmit(text)
                            isPresented = false
                        }
                    }
                }
                #endif
            }
            #endif
        }
    }
}
