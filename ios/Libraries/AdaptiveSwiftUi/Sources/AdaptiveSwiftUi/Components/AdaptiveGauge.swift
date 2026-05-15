import SwiftUI

public struct AdaptiveGauge<Label: View, CurrentValueLabel: View, MinimumValueLabel: View, MaximumValueLabel: View>: View {
    private let value: Double
    private let bounds: ClosedRange<Double>
    private let style: AdaptiveGaugeStyle
    private let label: () -> Label
    private let currentValueLabel: () -> CurrentValueLabel
    private let minimumValueLabel: () -> MinimumValueLabel
    private let maximumValueLabel: () -> MaximumValueLabel

    public init(
        value: Double,
        in bounds: ClosedRange<Double> = 0...1,
        style: AdaptiveGaugeStyle = .automatic,
        @ViewBuilder label: @escaping () -> Label,
        @ViewBuilder currentValueLabel: @escaping () -> CurrentValueLabel,
        @ViewBuilder minimumValueLabel: @escaping () -> MinimumValueLabel,
        @ViewBuilder maximumValueLabel: @escaping () -> MaximumValueLabel
    ) {
        self.value = value
        self.bounds = bounds
        self.style = style
        self.label = label
        self.currentValueLabel = currentValueLabel
        self.minimumValueLabel = minimumValueLabel
        self.maximumValueLabel = maximumValueLabel
    }

    // Convenience initializers
    public init(
        value: Double,
        in bounds: ClosedRange<Double> = 0...1,
        style: AdaptiveGaugeStyle = .automatic,
        @ViewBuilder label: @escaping () -> Label
    ) where CurrentValueLabel == EmptyView, MinimumValueLabel == EmptyView, MaximumValueLabel == EmptyView {
        self.init(
            value: value,
            in: bounds,
            style: style,
            label: label,
            currentValueLabel: { EmptyView() },
            minimumValueLabel: { EmptyView() },
            maximumValueLabel: { EmptyView() }
        )
    }

    public var body: some View {
        Group {
            #if os(iOS) || os(macOS) || os(watchOS) || os(visionOS)
            if #available(iOS 16.0, macOS 13.0, watchOS 7.0, visionOS 1.0, *) {
                Gauge(
                    value: value,
                    in: bounds,
                    label: label,
                    currentValueLabel: currentValueLabel,
                    minimumValueLabel: minimumValueLabel,
                    maximumValueLabel: maximumValueLabel
                )
            } else {
                fallbackView
            }
            #else
            fallbackView
            #endif
        }
        .adaptiveGaugeStyle(style)
    }

    private var fallbackView: some View {
        VStack(alignment: .leading, spacing: 4) {
            label()
                .font(.caption)
                .foregroundColor(.secondary)
            
            ProgressView(value: value, total: bounds.upperBound - bounds.lowerBound)
            
            HStack {
                minimumValueLabel()
                Spacer()
                currentValueLabel()
                Spacer()
                maximumValueLabel()
            }
            .font(.system(size: 10))
            .foregroundColor(.secondary)
        }
    }
}
