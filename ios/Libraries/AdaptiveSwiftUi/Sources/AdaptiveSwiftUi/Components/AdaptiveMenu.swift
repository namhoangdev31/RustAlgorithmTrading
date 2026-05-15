import SwiftUI

public struct AdaptiveMenu<Content: View, Label: View>: View {
    private let content: () -> Content
    private let label: () -> Label
    private let primaryAction: (() -> Void)?

    public init(
        @ViewBuilder content: @escaping () -> Content,
        @ViewBuilder label: @escaping () -> Label,
        primaryAction: (() -> Void)? = nil
    ) {
        self.content = content
        self.label = label
        self.primaryAction = primaryAction
    }

    // Convenience initializers for title-based labels
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
                // Fallback: Use a Button for primary action and a Menu for options?
                // Or just use a standard Menu if primaryAction is not supported.
                // Standard behavior on older OS is just the menu.
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
