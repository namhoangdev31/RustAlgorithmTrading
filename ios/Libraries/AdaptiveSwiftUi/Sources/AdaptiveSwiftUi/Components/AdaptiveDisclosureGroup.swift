import SwiftUI

/// An adaptive component that expands and collapses a view to reveal or hide its content.
///
/// `AdaptiveDisclosureGroup` provides a unified way to handle expandable content:
/// - **Modern OS (iOS 14+)**: Leverages the native `DisclosureGroup`.
/// - **Legacy Fallback (iOS 13)**: Renders a `VStack` with the label as a headline 
///   and the content below it to ensure visibility on older systems.
///
/// Example:
/// ```swift
/// AdaptiveDisclosureGroup("Details", isExpanded: $showDetails) {
///     Text("More information about this item...")
/// }
/// ```
public struct AdaptiveDisclosureGroup<Label: View, Content: View>: View {
    private let isExpanded: Binding<Bool>?
    private let content: () -> Content
    private let label: () -> Label

    /// Creates an adaptive disclosure group with a custom label view.
    ///
    /// - Parameters:
    ///   - isExpanded: A binding to a Boolean value that determines whether the group is expanded.
    ///   - content: A view builder describing the content to reveal.
    ///   - label: A view builder describing the label that controls the expansion.
    public init(
        isExpanded: Binding<Bool>? = nil,
        @ViewBuilder content: @escaping () -> Content,
        @ViewBuilder label: @escaping () -> Label
    ) {
        self.isExpanded = isExpanded
        self.content = content
        self.label = label
    }

    /// Creates an adaptive disclosure group with a localized title key.
    public init(
        _ titleKey: LocalizedStringKey,
        isExpanded: Binding<Bool>? = nil,
        @ViewBuilder content: @escaping () -> Content
    ) where Label == Text {
        self.isExpanded = isExpanded
        self.content = content
        self.label = { Text(titleKey) }
    }

    public var body: some View {
        if #available(iOS 14.0, macOS 11.0, visionOS 1.0, *) {
            if let isExpanded {
                DisclosureGroup(isExpanded: isExpanded, content: content, label: label)
            } else {
                DisclosureGroup(content: content, label: label)
            }
        } else {
            // Fallback for older OS: simple VStack (no built-in collapse/expand animation available easily)
            VStack(alignment: .leading) {
                label().font(.headline)
                content()
            }
        }
    }
}
