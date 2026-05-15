import SwiftUI

public struct AdaptiveDisclosureGroup<Label: View, Content: View>: View {
    private let isExpanded: Binding<Bool>?
    private let content: () -> Content
    private let label: () -> Label

    public init(
        isExpanded: Binding<Bool>? = nil,
        @ViewBuilder content: @escaping () -> Content,
        @ViewBuilder label: @escaping () -> Label
    ) {
        self.isExpanded = isExpanded
        self.content = content
        self.label = label
    }

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
            // Or just a standard VStack
            VStack(alignment: .leading) {
                label().font(.headline)
                content()
            }
        }
    }
}
