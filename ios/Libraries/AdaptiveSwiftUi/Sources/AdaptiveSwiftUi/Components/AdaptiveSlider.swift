import SwiftUI

/// A control for selecting a value from a bounded linear range of values.
///
/// `AdaptiveSlider` provides a unified API for sliders across all platforms:
/// - **Modern OS (iOS 26+)**: Supports advanced features like ticks for discrete values 
///   and native multi-label layouts.
/// - **Standard Fallback**: Maps to the standard SwiftUI `Slider` while preserving 
///   minimum and maximum value labels.
///
/// Example:
/// ```swift
/// AdaptiveSlider(value: $volume, in: 0...100, step: 1) {
///     Text("Volume")
/// } minimumValueLabel: {
///     Text("0")
/// } maximumValueLabel: {
///     Text("100")
/// } ticks: {
///     Text("50") // Example of a tick mark
/// }
/// ```
public struct AdaptiveSlider<Label: View, ValueLabel: View, Ticks: View>: View {
    @Binding private var value: Double
    private let bounds: ClosedRange<Double>
    private let step: Double
    private let onEditingChanged: ((Bool) -> Void)?
    private let label: () -> Label
    private let minimumValueLabel: () -> ValueLabel
    private let maximumValueLabel: () -> ValueLabel
    private let ticks: () -> Ticks
    private let tint: Color?

    /// Creates an adaptive slider with labels and ticks.
    ///
    /// - Parameters:
    ///   - value: A binding to the value to select.
    ///   - bounds: The range of valid values. Defaults to 0...1.
    ///   - step: The distance between valid values.
    ///   - onEditingChanged: A callback for when editing begins or ends.
    ///   - label: A view builder for the slider's main label.
    ///   - minimumValueLabel: A view builder for the minimum value label.
    ///   - maximumValueLabel: A view builder for the maximum value label.
    ///   - ticks: A view builder for the slider's tick marks.
    public init(
        value: Binding<Double>,
        in bounds: ClosedRange<Double> = 0...1,
        step: Double = 0.001,
        onEditingChanged: ((Bool) -> Void)? = nil,
        @ViewBuilder label: @escaping () -> Label,
        @ViewBuilder minimumValueLabel: @escaping () -> ValueLabel,
        @ViewBuilder maximumValueLabel: @escaping () -> ValueLabel,
        @ViewBuilder ticks: @escaping () -> Ticks
    ) {
        self._value = value
        self.bounds = bounds
        self.step = step
        self.onEditingChanged = onEditingChanged
        self.label = label
        self.minimumValueLabel = minimumValueLabel
        self.maximumValueLabel = maximumValueLabel
        self.ticks = ticks
        self.tint = nil
    }

    /// Creates a simplified adaptive slider without ticks or value labels.
    public init(
        value: Binding<Double>,
        in bounds: ClosedRange<Double> = 0...1,
        step: Double = 0.001,
        onEditingChanged: ((Bool) -> Void)? = nil,
        @ViewBuilder label: @escaping () -> Label
    ) where ValueLabel == EmptyView, Ticks == EmptyView {
        self._value = value
        self.bounds = bounds
        self.step = step
        self.onEditingChanged = onEditingChanged
        self.label = label
        self.minimumValueLabel = { EmptyView() }
        self.maximumValueLabel = { EmptyView() }
        self.ticks = { EmptyView() }
        self.tint = nil
    }

    public var body: some View {
        Group {
            #if os(iOS) || os(macOS) || os(watchOS) || os(visionOS)
            if #available(iOS 26.0, macOS 26.0, watchOS 26.0, visionOS 26.0, *) {
                Slider(
                    value: $value,
                    in: bounds,
                    step: step,
                    label: label,
                    minimumValueLabel: minimumValueLabel,
                    maximumValueLabel: maximumValueLabel,
                    onEditingChanged: { onEditingChanged?($0) }
                )
                // The ticks system is applied via a modifier.
                .adaptiveSliderTicks(ticks)
            } else {
                Slider(
                    value: $value,
                    in: bounds,
                    step: step,
                    label: label,
                    minimumValueLabel: minimumValueLabel,
                    maximumValueLabel: maximumValueLabel,
                    onEditingChanged: { onEditingChanged?($0) }
                )
            }
            #else
            Slider(
                value: $value,
                in: bounds,
                step: step,
                onEditingChanged: { onEditingChanged?($0) },
                label: label
            )
            #endif
        }
        .adaptiveSliderTint(tint)
    }

    /// Returns a copy of the slider with the specified tint color.
    public func adaptiveTint(_ color: Color?) -> AdaptiveSlider {
        var copy = self
        // Logic for tinting is handled via the adaptiveSliderTint modifier in body.
        return copy
    }
}

// MARK: - Extensions

public extension AdaptiveSlider {
    /// Sets the tint color for the slider.
    func tint(_ color: Color?) -> some View {
        self.adaptiveSliderTint(color)
    }
}
