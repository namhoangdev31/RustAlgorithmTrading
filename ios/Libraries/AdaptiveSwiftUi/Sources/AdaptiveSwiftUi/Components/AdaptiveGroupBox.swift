import SwiftUI

/// A container that groups related content within a visually distinct block.
///
/// `AdaptiveGroupBox` provides a bridge for the `GroupBox` component:
/// - **Modern OS (iOS 14+, macOS 10.15+)**: Leverages the native `GroupBox` for system-standard appearance.
/// - **Legacy Fallback**: Polyfills using a `VStack` with a rounded background and 
///   adaptive system colors to maintain visual consistency on older systems.
///
/// Example:
/// ```swift
/// AdaptiveGroupBox("Settings") {
///     Toggle("Enable Notifications", isOn: $isEnabled)
/// }
/// ```
public struct AdaptiveGroupBox<Label: View, Content: View>: View {
    private let content: () -> Content
    private let label: () -> Label
    private let hasLabel: Bool

    /// Creates a group box with a custom label view.
    ///
    /// - Parameters:
    ///   - content: A view builder for the group's body content.
    ///   - label: A view builder for the group's header/label.
    public init(
        @ViewBuilder content: @escaping () -> Content,
        @ViewBuilder label: @escaping () -> Label
    ) {
        self.content = content
        self.label = label
        self.hasLabel = true
    }

    /// Creates a group box without a label.
    public init(
        @ViewBuilder content: @escaping () -> Content
    ) where Label == EmptyView {
        self.content = content
        self.label = { EmptyView() }
        self.hasLabel = false
    }

    /// Creates a group box with a localized text title.
    public init(
        _ titleKey: LocalizedStringKey,
        @ViewBuilder content: @escaping () -> Content
    ) where Label == Text {
        self.content = content
        self.label = { Text(titleKey) }
        self.hasLabel = true
    }

    public var body: some View {
        if #available(iOS 14.0, macOS 10.15, tvOS 16.0, watchOS 9.0, visionOS 1.0, *) {
            if hasLabel {
                GroupBox(content: content, label: label)
            } else {
                // Initializer without label is iOS 14.0+, macOS 10.15+
                GroupBox {
                    content()
                }
            }
        } else {
            fallbackView
        }
    }
    
    @ViewBuilder
    private var fallbackView: some View {
        VStack(alignment: .leading, spacing: 8) {
            if hasLabel {
                label()
                    .font(.headline)
            }
            content()
        }
        .padding()
        #if canImport(UIKit)
        .background(
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .fill(Color(UIColor.secondarySystemBackground))
        )
        #elseif canImport(AppKit)
        .background(
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .fill(Color(NSColor.controlBackgroundColor))
        )
        #else
        .background(
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .fill(Color.gray.opacity(0.15))
        )
        #endif
    }
}
