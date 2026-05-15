import SwiftUI

public enum AdaptiveDatePickerStyle: Sendable {
    case automatic
    case wheel
    case graphical
    case field
    case stepperField
}

public struct AdaptiveMultiDatePicker<Label: View>: View {
    private let title: () -> Label
    private let selection: Binding<Set<DateComponents>>
    private let dateRange: PartialRangeFrom<Date>?

    public init(
        selection: Binding<Set<DateComponents>>,
        in dateRange: PartialRangeFrom<Date>? = nil,
        @ViewBuilder label: @escaping () -> Label
    ) {
        self.title = label
        self.selection = selection
        self.dateRange = dateRange
    }

    @ViewBuilder
    public var body: some View {
        #if os(iOS) || os(visionOS)
        if #available(iOS 16.0, visionOS 1.0, *) {
            if let dateRange {
                MultiDatePicker(selection: selection, in: dateRange) {
                    title()
                }
            } else {
                MultiDatePicker(selection: selection) {
                    title()
                }
            }
        } else {
            DatePicker(selection: .constant(Date()), displayedComponents: [.date]) {
                title()
            }
            .disabled(true)
        }
        #elseif os(macOS)
        DatePicker(selection: .constant(Date()), displayedComponents: [.date]) {
            title()
        }
        .disabled(true)
        #else
        title()
        #endif
    }
}

extension View {
    @ViewBuilder
    public func adaptiveDatePickerStyle(_ style: AdaptiveDatePickerStyle) -> some View {
        switch style {
        case .automatic:
            self.datePickerStyle(.automatic)
        case .wheel:
            #if os(iOS) || os(watchOS) || os(visionOS)
            if #available(iOS 13.0, watchOS 10.0, visionOS 1.0, *) {
                self.datePickerStyle(.wheel)
            } else {
                self
            }
            #else
            self
            #endif
        case .graphical:
            #if os(iOS) || os(macOS) || os(visionOS)
            if #available(iOS 14.0, macOS 10.15, visionOS 1.0, *) {
                self.datePickerStyle(.graphical)
            } else {
                self
            }
            #else
            self
            #endif
        case .field:
            #if os(macOS)
            self.datePickerStyle(.field)
            #else
            self
            #endif
        case .stepperField:
            #if os(macOS)
            self.datePickerStyle(.stepperField)
            #else
            self
            #endif
        }
    }

    @ViewBuilder
    public func adaptiveDatePickerTint(_ color: Color?) -> some View {
        if let color {
            if #available(iOS 15.0, macOS 12.0, watchOS 8.0, tvOS 15.0, *) {
                self.tint(color)
            } else {
                self.accentColor(color)
            }
        } else {
            self
        }
    }
}
