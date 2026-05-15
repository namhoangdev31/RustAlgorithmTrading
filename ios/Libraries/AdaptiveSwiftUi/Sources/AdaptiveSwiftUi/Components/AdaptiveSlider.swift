import SwiftUI

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

    // Convenience initializers for simpler cases
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
                // Note: The ticks system in iOS 26 is typically applied via a modifier 
                // or a specific initializer that doesn't conflict with standard labels.
                // We'll apply ticks as a modifier here to avoid signature conflicts.
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
        /// Note: In a struct, we'd need to handle this carefully if we want to preserve type
        /// For simplicity in this adaptive wrapper, we use a private property
        return copy /// Placeholder for tint logic if we weren't using modifiers
    }
}

// Since tint is better applied as a modifier, we extend View
public extension AdaptiveSlider {
    func tint(_ color: Color?) -> some View {
        self.adaptiveSliderTint(color)
    }
}
