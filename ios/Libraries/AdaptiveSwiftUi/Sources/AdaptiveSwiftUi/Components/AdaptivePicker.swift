import SwiftUI

public struct AdaptivePicker<SelectionValue: Hashable, Content: View, Label: View>: View {
    private let selection: Binding<SelectionValue>
    private let style: AdaptivePickerStyle
    private let content: () -> Content
    private let label: () -> Label
    private let currentValueLabel: AnyView?

    public init(
        selection: Binding<SelectionValue>,
        style: AdaptivePickerStyle = .automatic,
        @ViewBuilder content: @escaping () -> Content,
        @ViewBuilder label: @escaping () -> Label
    ) {
        self.selection = selection
        self.style = style
        self.content = content
        self.label = label
        self.currentValueLabel = nil
    }

    public init<V: View>(
        selection: Binding<SelectionValue>,
        style: AdaptivePickerStyle = .automatic,
        @ViewBuilder content: @escaping () -> Content,
        @ViewBuilder label: @escaping () -> Label,
        @ViewBuilder currentValueLabel: @escaping () -> V
    ) {
        self.selection = selection
        self.style = style
        self.content = content
        self.label = label
        self.currentValueLabel = AnyView(currentValueLabel())
    }

    // Convenience initializers for title-based labels
    public init(
        _ titleKey: LocalizedStringKey,
        selection: Binding<SelectionValue>,
        style: AdaptivePickerStyle = .automatic,
        @ViewBuilder content: @escaping () -> Content
    ) where Label == Text {
        self.init(
            selection: selection,
            style: style,
            content: content
        ) {
            Text(titleKey)
        }
    }

    public init(
        _ titleKey: LocalizedStringKey,
        systemImage: String,
        selection: Binding<SelectionValue>,
        style: AdaptivePickerStyle = .automatic,
        @ViewBuilder content: @escaping () -> Content
    ) where Label == SwiftUI.Label<Text, Image> {
        self.init(
            selection: selection,
            style: style,
            content: content
        ) {
            SwiftUI.Label(titleKey, systemImage: systemImage)
        }
    }

    public var body: some View {
        Group {
            if let currentValueLabel {
                AdaptiveValueLabelPicker(
                    selection: selection,
                    content: content,
                    label: label
                ) {
                    currentValueLabel
                }
            } else {
                Picker(selection: selection) {
                    content()
                } label: {
                    label()
                }
            }
        }
        .adaptivePickerStyle(style)
    }
}
