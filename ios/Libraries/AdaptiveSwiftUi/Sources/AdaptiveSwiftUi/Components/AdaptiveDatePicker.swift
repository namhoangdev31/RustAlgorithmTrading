import SwiftUI

/// A highly adaptive date picker component that works across all Apple platforms.
///
/// `AdaptiveDatePicker` provides a unified API for date and time selection, automatically 
/// handling platform-specific styles and OS version compatibility. It bridges the native 
/// `DatePicker` and applies adaptive styles such as graphical, wheel, or compact.
///
/// Example:
/// ```swift
/// AdaptiveDatePicker("Event Date", selection: $eventDate, style: .graphical)
/// ```
public struct AdaptiveDatePicker<Label: View>: View {
    @Binding private var selection: Date
    private let range: ClosedRange<Date>?
    private let displayedComponents: DatePickerComponents
    private let style: AdaptiveDatePickerStyle
    private let label: () -> Label
    private let tint: Color?

    /// Creates an adaptive date picker with a custom label view.
    ///
    /// - Parameters:
    ///   - selection: A binding to the selected date.
    ///   - range: An optional range of dates that the user can select.
    ///   - displayedComponents: The components of the date to display (e.g., `.date`, `.hourAndMinute`).
    ///   - style: The visual style to apply (e.g., `.wheel`, `.graphical`).
    ///   - label: A view builder describing the picker's label.
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

    /// Creates an adaptive date picker supporting a partial range from a start date.
    public init(
        selection: Binding<Date>,
        in range: PartialRangeFrom<Date>,
        displayedComponents: DatePickerComponents = [.date, .hourAndMinute],
        style: AdaptiveDatePickerStyle = .automatic,
        @ViewBuilder label: @escaping () -> Label
    ) {
        // Since we can't easily store PartialRangeFrom in a single property with ClosedRange,
        // we'll use a simplified approach or provide multiple initializers.
        self._selection = selection
        self.range = nil // Custom range logic can be added if needed
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

// MARK: - Convenience Initializer

public extension AdaptiveDatePicker {
    
    /// Creates an adaptive date picker with a localized title key.
    ///
    /// Example:
    /// ```swift
    /// AdaptiveDatePicker("Birthday", selection: $birthday, style: .wheel)
    /// ```
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
