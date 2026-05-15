import SwiftUI

/// An adaptive menu component that presents a list of actions when triggered.
///
/// `AdaptiveMenu` provides a unified interface for menus across all Apple platforms:
/// - **Modern OS (iOS 14+, macOS 11+)**: Leverages the native `Menu` component.
/// - **Primary Action (iOS 15+)**: Supports an optional primary action that executes 
///   when the user taps the menu button instead of long-pressing.
/// - **Legacy Fallback**: Automatically falls back to a standard `Menu` or equivalent 
///   action sheet/context menu interaction depending on the OS version.
///
/// Example:
/// ```swift
/// AdaptiveMenu("Options", systemImage: "ellipsis.circle") {
///     Button("Edit", systemImage: "pencil") { edit() }
///     Button("Delete", role: .destructive) { delete() }
/// }
/// ```
public struct AdaptiveMenu<Content: View, Label: View>: View {
    private let content: () -> Content
    private let label: () -> Label
    private let primaryAction: (() -> Void)?

    /// Creates an adaptive menu with a custom label view.
    ///
    /// - Parameters:
    ///   - content: A view builder for the menu items.
    ///   - label: A view builder for the menu trigger's label.
    ///   - primaryAction: An optional action to perform when the menu is tapped.
    public init(
        @ViewBuilder content: @escaping () -> Content,
        @ViewBuilder label: @escaping () -> Label,
        primaryAction: (() -> Void)? = nil
    ) {
        self.content = content
        self.label = label
        self.primaryAction = primaryAction
    }

    /// Creates an adaptive menu with a localized title key.
    public init(
        _ titleKey: LocalizedStringKey,
        @ViewBuilder content: @escaping () -> Content,
        primaryAction: (() -> Void)? = nil
    ) where Label == Text {
        self.init(
            content: content,
            label: { Text(titleKey) },
            primaryAction: primaryAction
        )
    }

    /// Creates an adaptive menu with a localized title and a system image.
    public init(
        _ titleKey: LocalizedStringKey,
        systemImage: String,
        @ViewBuilder content: @escaping () -> Content,
        primaryAction: (() -> Void)? = nil
    ) where Label == SwiftUI.Label<Text, Image> {
        self.init(
            content: content,
            label: { SwiftUI.Label(titleKey, systemImage: systemImage) },
            primaryAction: primaryAction
        )
    }

    public var body: some View {
        #if os(iOS) || os(macOS) || os(tvOS) || os(visionOS)
        if let primaryAction {
            if #available(iOS 15.0, macOS 12.0, tvOS 15.0, visionOS 1.0, *) {
                Menu(content: content, label: label, primaryAction: primaryAction)
            } else {
                // Fallback: Use standard Menu if primaryAction is not supported natively.
                Menu(content: content, label: label)
            }
        } else {
            Menu(content: content, label: label)
        }
        #else
        Menu(content: content, label: label)
        #endif
    }
}
