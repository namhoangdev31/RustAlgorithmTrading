import SwiftUI

public struct AdaptiveGauge<
    Label: View,
    CurrentValueLabel: View,
    MinimumValueLabel: View,
    MaximumValueLabel: View
>: View {
    private let value: Double
    private let range: ClosedRange<Double>
    private let style: AdaptiveGaugeStyle
    private let label: () -> Label
    private let currentValueLabel: () -> CurrentValueLabel
    private let minimumValueLabel: () -> MinimumValueLabel
    private let maximumValueLabel: () -> MaximumValueLabel

    // MARK: - Initializers

    public init(
        value: Double,
        in range: ClosedRange<Double> = 0...1,
        style: AdaptiveGaugeStyle = .automatic,
        @ViewBuilder label: @escaping () -> Label,
        @ViewBuilder currentValueLabel: @escaping () -> CurrentValueLabel,
        @ViewBuilder minimumValueLabel: @escaping () -> MinimumValueLabel,
        @ViewBuilder maximumValueLabel: @escaping () -> MaximumValueLabel
    ) {
        self.value = value
        self.range = range
        self.style = style
        self.label = label
        self.currentValueLabel = currentValueLabel
        self.minimumValueLabel = minimumValueLabel
        self.maximumValueLabel = maximumValueLabel
    }

    // Convenience: value + label
    public init(
        value: Double,
        style: AdaptiveGaugeStyle = .automatic,
        @ViewBuilder label: @escaping () -> Label
    )
    where
        CurrentValueLabel == EmptyView, MinimumValueLabel == EmptyView,
        MaximumValueLabel == EmptyView
    {
        self.init(
            value: value, in: 0...1, style: style, label: label,
            currentValueLabel: { EmptyView() },
            minimumValueLabel: { EmptyView() },
            maximumValueLabel: { EmptyView() }
        )
    }

    // Convenience: value + range + label
    public init(
        value: Double,
        in range: ClosedRange<Double>,
        style: AdaptiveGaugeStyle = .automatic,
        @ViewBuilder label: @escaping () -> Label
    )
    where
        CurrentValueLabel == EmptyView, MinimumValueLabel == EmptyView,
        MaximumValueLabel == EmptyView
    {
        self.init(
            value: value, in: range, style: style, label: label,
            currentValueLabel: { EmptyView() },
            minimumValueLabel: { EmptyView() },
            maximumValueLabel: { EmptyView() }
        )
    }

    // Convenience: value + label + currentValueLabel
    public init(
        value: Double,
        style: AdaptiveGaugeStyle = .automatic,
        @ViewBuilder label: @escaping () -> Label,
        @ViewBuilder currentValueLabel: @escaping () -> CurrentValueLabel
    ) where MinimumValueLabel == EmptyView, MaximumValueLabel == EmptyView {
        self.init(
            value: value, in: 0...1, style: style, label: label,
            currentValueLabel: currentValueLabel,
            minimumValueLabel: { EmptyView() },
            maximumValueLabel: { EmptyView() }
        )
    }

    public var body: some View {
        Group {
            #if os(iOS) || os(macOS) || os(watchOS) || os(visionOS)
                if #available(iOS 16.0, macOS 13.0, watchOS 7.0, visionOS 1.0, *) {
                    nativeGauge
                } else {
                    fallbackView
                }
            #else
                fallbackView
            #endif
        }
        .adaptiveGaugeStyle(style)
    }

    #if os(iOS) || os(macOS) || os(watchOS) || os(visionOS)
        @available(iOS 16.0, macOS 13.0, watchOS 7.0, visionOS 1.0, *)
        private var nativeGauge: some View {
            Gauge(
                value: value,
                in: range,
                label: { label() },
                currentValueLabel: { currentValueLabel() },
                minimumValueLabel: { AnyView(minimumValueLabel()) },
                maximumValueLabel: { AnyView(maximumValueLabel()) }
            )
        }
    #endif

    private var fallbackView: some View {
        VStack(alignment: .leading, spacing: 4) {
            label()
                .font(.caption)
                .foregroundColor(.secondary)

            ProgressView(value: normalizedValue)

            HStack {
                AnyView(minimumValueLabel())
                Spacer()
                currentValueLabel()
                Spacer()
                AnyView(maximumValueLabel())
            }
            .font(.system(size: 10))
            .foregroundColor(.secondary)
        }
    }

    private var normalizedValue: Double {
        let span = range.upperBound - range.lowerBound
        guard span > 0 else { return 0 }
        return min(max((value - range.lowerBound) / span, 0), 1)
    }
}
