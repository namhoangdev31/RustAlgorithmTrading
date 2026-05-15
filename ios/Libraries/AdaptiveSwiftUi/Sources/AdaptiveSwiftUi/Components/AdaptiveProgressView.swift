import SwiftUI

public struct AdaptiveProgressView<Label: View, CurrentValueLabel: View>: View {
    private enum ProgressType {
        case indeterminate
        case value(Double, Double)
        case timer(DateInterval)
    }

    private let type: ProgressType
    private let style: AdaptiveProgressViewStyle
    private let label: (() -> Label)?
    private let currentValueLabel: (() -> CurrentValueLabel)?
    private let tint: Color?

    // Indeterminate
    public init(
        style: AdaptiveProgressViewStyle = .automatic,
        @ViewBuilder label: @escaping () -> Label
    ) where CurrentValueLabel == EmptyView {
        self.type = .indeterminate
        self.style = style
        self.label = label
        self.currentValueLabel = nil
        self.tint = nil
    }

    // Value-based
    public init(
        value: Double,
        total: Double = 1.0,
        style: AdaptiveProgressViewStyle = .automatic,
        @ViewBuilder label: @escaping () -> Label,
        @ViewBuilder currentValueLabel: @escaping () -> CurrentValueLabel
    ) {
        self.type = .value(value, total)
        self.style = style
        self.label = label
        self.currentValueLabel = currentValueLabel
        self.tint = nil
    }

    // Timer-based (available in newer OS)
    @available(iOS 14.0, macOS 11.0, watchOS 7.0, tvOS 14.0, *)
    public init(
        timerInterval: DateInterval,
        countsDown: Bool = false,
        style: AdaptiveProgressViewStyle = .automatic,
        @ViewBuilder label: @escaping () -> Label,
        @ViewBuilder currentValueLabel: @escaping () -> CurrentValueLabel
    ) {
        self.type = .timer(timerInterval)
        self.style = style
        self.label = label
        self.currentValueLabel = currentValueLabel
        self.tint = nil
    }

    public var body: some View {
        Group {
            #if os(iOS) || os(macOS) || os(watchOS) || os(tvOS) || os(visionOS)
                if #available(iOS 14.0, macOS 11.0, watchOS 7.0, tvOS 14.0, visionOS 1.0, *) {
                    nativeProgressView
                } else {
                    fallbackView
                }
            #else
                fallbackView
            #endif
        }
        .adaptiveProgressViewStyle(style)
        .adaptiveProgressTint(tint)
    }

    @ViewBuilder
    private var nativeProgressView: some View {
        switch type {
        case .indeterminate:
            if let label = label {
                ProgressView(label: label)
            } else {
                ProgressView()
            }
        case .value(let value, let total):
            if let label = label, let currentValueLabel = currentValueLabel {
                ProgressView(value: value, total: total, label: label, currentValueLabel: currentValueLabel)
            } else if let label = label {
                ProgressView(value: value, total: total, label: label)
            } else {
                ProgressView(value: value, total: total)
            }
        case .timer(let interval):
            if #available(iOS 16.0, macOS 13.0, tvOS 16.0, watchOS 9.0, *) {
                if let label = label, let currentValueLabel = currentValueLabel {
                    ProgressView(
                        timerInterval: interval.start...interval.end,
                        label: label,
                        currentValueLabel: currentValueLabel
                    )
                } else if let label = label {
                    ProgressView(timerInterval: interval.start...interval.end, label: label)
                } else {
                    ProgressView(timerInterval: interval.start...interval.end)
                }
            } else {
                fallbackView
            }
        }
    }

    @ViewBuilder
    private var fallbackView: some View {
        VStack(spacing: 8) {
            label?()
            switch type {
            case .indeterminate:
                // Simple placeholder for activity indicator
                Circle()
                    .trim(from: 0, to: 0.7)
                    .stroke(Color.accentColor, lineWidth: 2)
                    .frame(width: 20, height: 20)
            case .value(let value, let total):
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.secondary.opacity(0.2))
                    Capsule().fill(Color.accentColor)
                        .frame(width: CGFloat(value / total) * 100)  // Mock width
                }
                .frame(height: 4)
            case .timer(_):
                Text("Timer active...")
            }
            currentValueLabel?()
        }
    }
}

// Convenience initializers
extension AdaptiveProgressView where CurrentValueLabel == EmptyView {
    /// Creates an indeterminate progress view with a label.
    public init(style: AdaptiveProgressViewStyle = .automatic, @ViewBuilder label: @escaping () -> Label) {
        self.type = .indeterminate
        self.style = style
        self.label = label
        self.currentValueLabel = nil
        self.tint = nil
    }

    /// Creates a progress view for a specific value and total.
    public init(
        value: Double,
        total: Double = 1.0,
        style: AdaptiveProgressViewStyle = .automatic,
        @ViewBuilder label: @escaping () -> Label
    ) {
        self.type = .value(value, total)
        self.style = style
        self.label = label
        self.currentValueLabel = nil
        self.tint = nil
    }
}

extension AdaptiveProgressView where Label == Text, CurrentValueLabel == EmptyView {
    /// Creates an indeterminate progress view with a title string.
    public init<S: StringProtocol>(_ title: S, style: AdaptiveProgressViewStyle = .automatic) {
        self.type = .indeterminate
        self.style = style
        self.label = { Text(title) }
        self.currentValueLabel = nil
        self.tint = nil
    }

    /// Creates a progress view for a specific value and total with a title string.
    public init<S: StringProtocol>(_ title: S, value: Double, total: Double = 1.0, style: AdaptiveProgressViewStyle = .automatic) {
        self.type = .value(value, total)
        self.style = style
        self.label = { Text(title) }
        self.currentValueLabel = nil
        self.tint = nil
    }
}
