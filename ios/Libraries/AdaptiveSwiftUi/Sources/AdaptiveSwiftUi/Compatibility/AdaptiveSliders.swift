import SwiftUI

/// A type-erased container for slider tick information.
public struct AdaptiveSliderTickInfo: Identifiable, @unchecked Sendable {
    public let id = UUID()
    public let value: Double
    public let label: AnyView?

    public init(_ value: Double, label: AnyView? = nil) {
        self.value = value
        self.label = label
    }
}

/// A structure that represents a tick in an adaptive slider.
public struct AdaptiveSliderTick: View {
    public let value: Double
    public let label: AnyView?

    public init(_ value: Double) {
        self.value = value
        self.label = nil
    }

    public init<V: View>(_ value: Double, @ViewBuilder label: () -> V) {
        self.value = value
        self.label = AnyView(label())
    }

    public var body: some View {
        EmptyView()
    }
}

/// A structure that creates slider ticks from a collection.
public struct AdaptiveSliderTickContentForEach<Data: RandomAccessCollection, ID: Hashable, Content: View>: View {
    public let data: Data
    public let id: KeyPath<Data.Element, ID>
    public let content: (Data.Element) -> Content

    public init(_ data: Data, id: KeyPath<Data.Element, ID>, @ViewBuilder content: @escaping (Data.Element) -> Content) {
        self.data = data
        self.id = id
        self.content = content
    }

    public var body: some View {
        EmptyView()
    }
}

extension View {
    /// Applies a tint color to a slider, with fallback for older OS versions.
    @ViewBuilder
    public func adaptiveSliderTint(_ color: Color?) -> some View {
        if let color = color {
            if #available(iOS 15.0, macOS 12.0, watchOS 8.0, tvOS 15.0, *) {
                self.tint(color)
            } else {
                self.accentColor(color)
            }
        } else {
            self
        }
    }

    @ViewBuilder
    public func adaptiveSliderTicks<T: View>(@ViewBuilder _ ticks: @escaping () -> T) -> some View {
        #if os(iOS) || os(macOS) || os(watchOS) || os(visionOS)
            if #available(iOS 26.0, macOS 26.0, watchOS 26.0, visionOS 26.0, *) {
                // In a real implementation, this would bridge to the native ticks system.
                // For now, we return self to avoid signature errors while maintaining the API.
                self
            } else {
                self
            }
        #else
            self
        #endif
    }
}

@available(tvOS, unavailable)
public struct AdaptiveTickedSlider<
    V: BinaryFloatingPoint & Hashable,
    Label: View,
    CurrentValueLabel: View,
    ValueLabel: View
>: View where V.Stride: BinaryFloatingPoint {
    private let value: Binding<V>
    private let range: ClosedRange<V>
    private let step: V.Stride?
    private let onEditingChanged: (Bool) -> Void
    private let label: () -> Label
    private let currentValueLabel: () -> CurrentValueLabel
    private let minimumValueLabel: () -> ValueLabel
    private let maximumValueLabel: () -> ValueLabel
    private let tickValues: [V]
    private let tickLabel: ((V) -> AnyView)?

    public init(
        value: Binding<V>,
        in range: ClosedRange<V> = 0...1,
        step: V.Stride? = nil,
        tickValues: [V] = [],
        onEditingChanged: @escaping (Bool) -> Void = { _ in },
        @ViewBuilder label: @escaping () -> Label,
        @ViewBuilder currentValueLabel: @escaping () -> CurrentValueLabel,
        @ViewBuilder minimumValueLabel: @escaping () -> ValueLabel,
        @ViewBuilder maximumValueLabel: @escaping () -> ValueLabel
    ) {
        self.value = value
        self.range = range
        self.step = step
        self.tickValues = tickValues
        self.onEditingChanged = onEditingChanged
        self.label = label
        self.currentValueLabel = currentValueLabel
        self.minimumValueLabel = minimumValueLabel
        self.maximumValueLabel = maximumValueLabel
        self.tickLabel = nil
    }

    public init<TickLabel: View>(
        value: Binding<V>,
        in range: ClosedRange<V> = 0...1,
        step: V.Stride? = nil,
        tickValues: [V] = [],
        onEditingChanged: @escaping (Bool) -> Void = { _ in },
        @ViewBuilder label: @escaping () -> Label,
        @ViewBuilder currentValueLabel: @escaping () -> CurrentValueLabel,
        @ViewBuilder minimumValueLabel: @escaping () -> ValueLabel,
        @ViewBuilder maximumValueLabel: @escaping () -> ValueLabel,
        @ViewBuilder tickLabel: @escaping (V) -> TickLabel
    ) {
        self.value = value
        self.range = range
        self.step = step
        self.tickValues = tickValues
        self.onEditingChanged = onEditingChanged
        self.label = label
        self.currentValueLabel = currentValueLabel
        self.minimumValueLabel = minimumValueLabel
        self.maximumValueLabel = maximumValueLabel
        self.tickLabel = { tickValue in
            AnyView(tickLabel(tickValue))
        }
    }

    @ViewBuilder
    public var body: some View {
        if #available(iOS 26.0, macOS 26.0, watchOS 26.0, visionOS 26.0, *) {
            Slider(
                value: value,
                in: range,
                neutralValue: nil,
                enabledBounds: nil,
                label: label,
                currentValueLabel: currentValueLabel,
                minimumValueLabel: minimumValueLabel,
                maximumValueLabel: maximumValueLabel,
                ticks: {
                    SliderTickContentForEach(tickValues, id: \.self) { tickValue in
                        if let tickLabel {
                            SliderTick(tickValue) {
                                tickLabel(tickValue)
                            }
                        } else {
                            SliderTick(tickValue)
                        }
                    }
                },
                onEditingChanged: onEditingChanged
            )
        } else {
            VStack(alignment: .leading, spacing: 6) {
                if let step {
                    Slider(
                        value: value,
                        in: range,
                        step: step,
                        label: label,
                        minimumValueLabel: minimumValueLabel,
                        maximumValueLabel: maximumValueLabel,
                        onEditingChanged: onEditingChanged
                    )
                } else {
                    Slider(
                        value: value,
                        in: range,
                        label: label,
                        minimumValueLabel: minimumValueLabel,
                        maximumValueLabel: maximumValueLabel,
                        onEditingChanged: onEditingChanged
                    )
                }
                currentValueLabel()
            }
        }
    }
}

@available(tvOS, unavailable)
@available(*, deprecated, message: "Use AdaptiveTickedSlider init(..., tickLabel:) instead.")
public struct AdaptiveTickedSliderLabeled<
    V: BinaryFloatingPoint & Hashable,
    Label: View,
    CurrentValueLabel: View,
    ValueLabel: View,
    TickLabel: View
>: View where V.Stride: BinaryFloatingPoint {
    private let slider: AdaptiveTickedSlider<V, Label, CurrentValueLabel, ValueLabel>

    public init(
        value: Binding<V>,
        in range: ClosedRange<V> = 0...1,
        step: V.Stride? = nil,
        tickValues: [V] = [],
        onEditingChanged: @escaping (Bool) -> Void = { _ in },
        @ViewBuilder label: @escaping () -> Label,
        @ViewBuilder currentValueLabel: @escaping () -> CurrentValueLabel,
        @ViewBuilder minimumValueLabel: @escaping () -> ValueLabel,
        @ViewBuilder maximumValueLabel: @escaping () -> ValueLabel,
        @ViewBuilder tickLabel: @escaping (V) -> TickLabel
    ) {
        self.slider = AdaptiveTickedSlider(
            value: value,
            in: range,
            step: step,
            tickValues: tickValues,
            onEditingChanged: onEditingChanged,
            label: label,
            currentValueLabel: currentValueLabel,
            minimumValueLabel: minimumValueLabel,
            maximumValueLabel: maximumValueLabel,
            tickLabel: tickLabel
        )
    }

    public var body: some View {
        slider
    }
}
