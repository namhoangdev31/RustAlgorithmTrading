import SwiftUI

public enum AdaptivePickerStyle: Sendable {
    case automatic
    case menu
    case inline
    case navigationLink
    case palette
    case segmented
    case wheel
    case radioGroup
}

public struct AdaptiveValueLabelPicker<
    SelectionValue: Hashable,
    Content: View,
    Label: View,
    CurrentValueLabel: View
>: View {
    private let selection: Binding<SelectionValue>
    private let content: () -> Content
    private let label: () -> Label
    private let currentValueLabel: () -> CurrentValueLabel

    public init(
        selection: Binding<SelectionValue>,
        @ViewBuilder content: @escaping () -> Content,
        @ViewBuilder label: @escaping () -> Label,
        @ViewBuilder currentValueLabel: @escaping () -> CurrentValueLabel
    ) {
        self.selection = selection
        self.content = content
        self.label = label
        self.currentValueLabel = currentValueLabel
    }

    @ViewBuilder
    public var body: some View {
        #if os(iOS) || os(macOS) || os(watchOS) || os(tvOS) || os(visionOS)
        if #available(iOS 18.0, macOS 15.0, watchOS 11.0, tvOS 18.0, visionOS 2.0, *) {
            Picker(selection: selection) {
                content()
            } label: {
                label()
            } currentValueLabel: {
                currentValueLabel()
            }
        } else {
            Picker(selection: selection) {
                content()
            } label: {
                label()
            }
        }
        #else
        Picker(selection: selection) {
            content()
        } label: {
            label()
        }
        #endif
    }
}

public extension View {
    @ViewBuilder
    func adaptivePickerStyle(_ style: AdaptivePickerStyle) -> some View {
        switch style {
        case .automatic:
            self.pickerStyle(.automatic)
        case .menu:
            #if os(iOS) || os(macOS) || os(tvOS) || os(visionOS)
            if #available(iOS 14.0, macOS 11.0, tvOS 17.0, visionOS 1.0, *) {
                self.pickerStyle(.menu)
            } else {
                self
            }
            #else
            self
            #endif
        case .inline:
            #if os(iOS) || os(macOS) || os(watchOS) || os(tvOS) || os(visionOS)
            if #available(iOS 14.0, macOS 11.0, watchOS 7.0, tvOS 14.0, visionOS 1.0, *) {
                self.pickerStyle(.inline)
            } else {
                self
            }
            #else
            self
            #endif
        case .navigationLink:
            #if os(iOS) || os(watchOS) || os(tvOS) || os(visionOS)
            if #available(iOS 16.0, watchOS 9.0, tvOS 16.0, visionOS 1.0, *) {
                self.pickerStyle(.navigationLink)
            } else {
                self
            }
            #else
            self
            #endif
        case .palette:
            #if os(iOS) || os(macOS) || os(visionOS)
            if #available(iOS 17.0, macOS 14.0, visionOS 1.0, *) {
                self.pickerStyle(.palette)
            } else {
                self
            }
            #else
            self
            #endif
        case .segmented:
            #if os(iOS) || os(macOS) || os(tvOS) || os(visionOS)
            if #available(iOS 13.0, macOS 10.15, tvOS 13.0, visionOS 1.0, *) {
                self.pickerStyle(.segmented)
            } else {
                self
            }
            #else
            self
            #endif
        case .wheel:
            #if os(iOS) || os(watchOS) || os(visionOS)
            if #available(iOS 13.0, watchOS 6.0, visionOS 1.0, *) {
                self.pickerStyle(.wheel)
            } else {
                self
            }
            #else
            self
            #endif
        case .radioGroup:
            #if os(macOS)
            if #available(macOS 10.15, *) {
                self.pickerStyle(.radioGroup)
            } else {
                self
            }
            #else
            self
            #endif
        }
    }

    @ViewBuilder
    func adaptiveHorizontalRadioGroupLayout(isEnabled: Bool = true) -> some View {
        #if os(macOS)
        if isEnabled {
            if #available(macOS 10.15, *) {
                self.horizontalRadioGroupLayout()
            } else {
                self
            }
        } else {
            self
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    func adaptiveDefaultWheelPickerItemHeight(_ height: CGFloat?) -> some View {
        #if os(watchOS)
        if let height {
            if #available(watchOS 6.0, *) {
                self.defaultWheelPickerItemHeight(height)
            } else {
                self
            }
        } else {
            self
        }
        #else
        self
        #endif
    }
}
