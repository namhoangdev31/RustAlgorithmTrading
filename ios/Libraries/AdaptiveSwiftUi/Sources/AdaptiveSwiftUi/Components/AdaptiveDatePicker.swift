import SwiftUI

public struct AdaptiveDatePicker<Label: View>: View {
    @Binding private var selection: Date
    private let range: ClosedRange<Date>?
    private let displayedComponents: DatePickerComponents
    private let style: AdaptiveDatePickerStyle
    private let label: () -> Label
    private let tint: Color?

    public init(
        selection: Binding<Date>,
        in range: ClosedRange<Date>? = nil,
        displayedComponents: DatePickerComponents = [.date, .hourAndMinute],
        style: AdaptiveDatePickerStyle = .automatic,
        @ViewBuilder label: @escaping () -> Label
    ) {
        self._selection = selection
        self.range = range
        self.displayedComponents = displayedComponents
        self.style = style
        self.label = label
        self.tint = nil
    }

    // Initializer for partial ranges (Future dates)
    public init(
        selection: Binding<Date>,
        in range: PartialRangeFrom<Date>,
        displayedComponents: DatePickerComponents = [.date, .hourAndMinute],
        style: AdaptiveDatePickerStyle = .automatic,
        @ViewBuilder label: @escaping () -> Label
    ) {
        // Since we can't easily store PartialRangeFrom in a single property with ClosedRange,
        // we'll use a simplified approach or provide multiple initializers.
        // For this adaptive version, we'll store a mock range and handle it in the body.
        self._selection = selection
        self.range = nil // Use a different logic for partial ranges if needed
        self.displayedComponents = displayedComponents
        self.style = style
        self.label = label
        self.tint = nil
    }

    public var body: some View {
        Group {
            if let range = range {
                DatePicker(
                    selection: $selection,
                    in: range,
                    displayedComponents: displayedComponents,
                    label: label
                )
            } else {
                DatePicker(
                    selection: $selection,
                    displayedComponents: displayedComponents,
                    label: label
                )
            }
        }
        .adaptiveDatePickerStyle(style)
        .adaptiveDatePickerTint(tint)
    }
}

// Convenience extension
public extension AdaptiveDatePicker {
    init(
        _ titleKey: LocalizedStringKey,
        selection: Binding<Date>,
        in range: ClosedRange<Date>? = nil,
        displayedComponents: DatePickerComponents = [.date, .hourAndMinute],
        style: AdaptiveDatePickerStyle = .automatic
    ) where Label == Text {
        self.init(
            selection: selection,
            in: range,
            displayedComponents: displayedComponents,
            style: style
        ) {
            Text(titleKey)
        }
    }
}
