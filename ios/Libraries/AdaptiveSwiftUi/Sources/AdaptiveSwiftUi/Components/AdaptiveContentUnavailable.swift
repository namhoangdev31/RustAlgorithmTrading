import SwiftUI

/// An adaptive view for displaying states when content is unavailable.
///
/// `AdaptiveContentUnavailableView` provides a consistent way to inform users about 
/// empty states (e.g., no data, search results not found, or connection errors).
/// - **Modern OS (iOS 17+)**: Leverages the native `ContentUnavailableView`.
/// - **Legacy Fallback**: Uses a custom `VStack` implementation with standardized styling 
///   to ensure functional and visual parity.
///
/// Example:
/// ```swift
/// AdaptiveContentUnavailableView("No Connection", systemImage: "wifi.slash") {
///     Button("Retry") { reloadData() }
/// }
/// ```
public struct AdaptiveContentUnavailableView<Label: View, Description: View, Actions: View>: View {
    private enum Variant {
        case custom
        case search(String?)
    }
    
    private let variant: Variant
    private let label: Label
    private let description: Description
    private let actions: Actions
 
    /// Creates a custom adaptive content unavailable view.
    ///
    /// - Parameters:
    ///   - label: A view builder for the primary label (icon/title).
    ///   - description: A view builder for the secondary descriptive text.
    ///   - actions: A view builder for action buttons.
    public init(
        @ViewBuilder label: () -> Label,
        @ViewBuilder description: () -> Description = { EmptyView() },
        @ViewBuilder actions: () -> Actions = { EmptyView() }
    ) {
        self.variant = .custom
        self.label = label()
        self.description = description()
        self.actions = actions()
    }

    private init(variant: Variant, label: Label, description: Description, actions: Actions) {
        self.variant = variant
        self.label = label
        self.description = description
        self.actions = actions
    }

    public var body: some View {
        if #available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, visionOS 1.0, *) {
            nativeView
        } else {
            fallbackView
        }
    }

    @available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, visionOS 1.0, *)
    @ViewBuilder
    private var nativeView: some View {
        switch variant {
        case .custom:
            ContentUnavailableView {
                label
            } description: {
                description
            } actions: {
                actions
            }
        case .search(let text):
            if let text {
                ContentUnavailableView.search(text: text)
            } else {
                ContentUnavailableView.search
            }
        }
    }

    @ViewBuilder
    private var fallbackView: some View {
        VStack(spacing: 16) {
            switch variant {
            case .custom:
                label
                    .font(.headline)
            case .search(let text):
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 48))
                    .foregroundStyle(.secondary)
                
                Text("No Results")
                    .font(.headline)
                
                if let text, !text.isEmpty {
                    Text("No results for \"\(text)\"")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            
            description
                .font(.subheadline)
                .foregroundStyle(.secondary)
            
            actions
                .padding(.top, 8)
        }
        .multilineTextAlignment(.center)
        .padding(32)
    }
}

// MARK: - Search Extension

public extension AdaptiveContentUnavailableView where Label == EmptyView, Description == EmptyView, Actions == EmptyView {
    
    /// A pre-built adaptive placeholder for empty search results.
    static var search: AdaptiveContentUnavailableView<EmptyView, EmptyView, EmptyView> {
        AdaptiveContentUnavailableView(variant: .search(nil), label: EmptyView(), description: EmptyView(), actions: EmptyView())
    }
    
    /// A pre-built adaptive placeholder for empty search results with specific search text.
    static func search(text: String) -> AdaptiveContentUnavailableView<EmptyView, EmptyView, EmptyView> {
        AdaptiveContentUnavailableView(variant: .search(text), label: EmptyView(), description: EmptyView(), actions: EmptyView())
    }
}

// MARK: - Convenience Initializers

public extension AdaptiveContentUnavailableView where Label == SwiftUI.Label<Text, Image>, Description == Text, Actions == EmptyView {
    
    /// Creates an adaptive content unavailable view using a localized title and system image.
    init(_ title: LocalizedStringKey, systemImage: String, description: LocalizedStringKey? = nil) {
        self.init(
            variant: .custom,
            label: SwiftUI.Label(title, systemImage: systemImage),
            description: description.map { Text($0) } ?? Text(""),
            actions: EmptyView()
        )
    }
    
    /// Creates an adaptive content unavailable view using a title string and system image.
    init<S: StringProtocol>(_ title: S, systemImage: String, description: S? = nil) {
        self.init(
            variant: .custom,
            label: SwiftUI.Label(title, systemImage: systemImage),
            description: description.map { Text($0) } ?? Text(""),
            actions: EmptyView()
        )
    }
}

public extension AdaptiveContentUnavailableView where Label == SwiftUI.Label<Text, Image>, Description == Text {
    
    /// Creates an adaptive content unavailable view with a localized title, image, and custom actions.
    init(
        _ title: LocalizedStringKey,
        systemImage: String,
        description: LocalizedStringKey? = nil,
        @ViewBuilder actions: () -> Actions
    ) {
        self.init(
            variant: .custom,
            label: SwiftUI.Label(title, systemImage: systemImage),
            description: description.map { Text($0) } ?? Text(""),
            actions: actions()
        )
    }
    
    /// Creates an adaptive content unavailable view with a title string, image, and custom actions.
    init<S: StringProtocol>(
        _ title: S,
        systemImage: String,
        description: S? = nil,
        @ViewBuilder actions: () -> Actions
    ) {
        self.init(
            variant: .custom,
            label: SwiftUI.Label(title, systemImage: systemImage),
            description: description.map { Text($0) } ?? Text(""),
            actions: actions()
        )
    }
}
