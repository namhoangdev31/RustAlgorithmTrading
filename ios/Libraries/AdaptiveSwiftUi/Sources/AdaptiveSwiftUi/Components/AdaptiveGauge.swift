import SwiftUI

/// An adaptive gauge component that displays a value within a range.
///
/// `AdaptiveGauge` provides a unified way to render gauges across platforms:
/// - **Modern OS (iOS 16+, macOS 13+, watchOS 7+)**: Leverages the native `Gauge` component 
///   with support for all 8 adaptive styles.
/// - **Legacy Fallback**: Polyfills using a `VStack` containing a `ProgressView` and 
///   descriptive labels to ensure functional parity on older systems.
///
/// Example:
/// ```swift
/// AdaptiveGauge(value: 0.75, in: 0...1, style: .accessoryCircular) {
///     Text("Battery")
/// } currentValueLabel: {
///     Text("75%")
/// }
/// ```
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

    /// Creates an adaptive gauge with full control over labels and range.
    ///
    /// - Parameters:
    ///   - value: The current value to display.
    ///   - range: The valid range for the value.
    ///   - style: The adaptive gauge style to apply.
    ///   - label: A view builder for the primary label.
    ///   - currentValueLabel: A view builder for the current value label.
    ///   - minimumValueLabel: A view builder for the minimum range label.
    ///   - maximumValueLabel: A view builder for the maximum range label.
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

    /// Creates an adaptive gauge with only a value and label.
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

    /// Creates an adaptive gauge with a value, range, and label.
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

    /// Creates an adaptive gauge with a value, label, and current value label.
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
