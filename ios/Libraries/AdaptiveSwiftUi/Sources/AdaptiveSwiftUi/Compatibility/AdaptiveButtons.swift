import SwiftUI

public enum AdaptiveButtonSizing: Sendable {
    case automatic
    case fitted
    case flexible
}

public enum AdaptiveButtonStyle: Sendable {
    case automatic
    case plain
    case borderless
    case bordered
    case borderedProminent
    case glass
    case glassProminent
}

public enum AdaptiveControlSize: Sendable {
    case mini
    case small
    case regular
    case large
    case extraLarge
}

public enum AdaptiveButtonBorderShape: Sendable {
    case automatic
    case roundedRectangle
    case capsule
    case circle
    case roundedRectangleRadius(CGFloat)
}

public enum AdaptiveMaterialStyle: Sendable {
    case ultraThin
    case thin
    case regular
    case thick
    case ultraThick
}

public enum AdaptiveHierarchicalVariant: Sendable {
    case primary
    case secondary
    case tertiary
    case quaternary
    case quinary
}

public enum AdaptiveControlGroupStyle: Sendable {
    case automatic
    case navigation
    case menu
    case compactMenu
    case palette
}

public enum AdaptiveGaugeStyle: Sendable {
    case automatic
    case linear
    case circular
    case accessoryLinear
    case accessoryLinearCapacity
    case linearCapacity
    case accessoryCircular
    case accessoryCircularCapacity
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
        in range: ClosedRange<V> = 0 ... 1,
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
        in range: ClosedRange<V> = 0 ... 1,
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

// MARK: - AdaptiveTickedSlider with custom tick labels

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
        in range: ClosedRange<V> = 0 ... 1,
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

// MARK: - AdaptiveGauge

public struct AdaptiveGauge<
    CurrentValueLabel: View,
    GaugeLabel: View,
    BoundValueLabel: View
>: View {
    private let value: Double
    private let range: ClosedRange<Double>
    private let label: () -> GaugeLabel
    private let currentValueLabel: (() -> CurrentValueLabel)?
    private let minimumValueLabel: (() -> BoundValueLabel)?
    private let maximumValueLabel: (() -> BoundValueLabel)?

    // MARK: Init – value + label
    public init(
        value: Double,
        @ViewBuilder label: @escaping () -> GaugeLabel
    ) where CurrentValueLabel == EmptyView, BoundValueLabel == EmptyView {
        self.value = value
        self.range = 0 ... 1
        self.label = label
        self.currentValueLabel = nil
        self.minimumValueLabel = nil
        self.maximumValueLabel = nil
    }

    // MARK: Init – value + in range + label
    public init(
        value: Double,
        in range: ClosedRange<Double>,
        @ViewBuilder label: @escaping () -> GaugeLabel
    ) where CurrentValueLabel == EmptyView, BoundValueLabel == EmptyView {
        self.value = value
        self.range = range
        self.label = label
        self.currentValueLabel = nil
        self.minimumValueLabel = nil
        self.maximumValueLabel = nil
    }

    // MARK: Init – value + label + currentValueLabel
    public init(
        value: Double,
        @ViewBuilder label: @escaping () -> GaugeLabel,
        @ViewBuilder currentValueLabel: @escaping () -> CurrentValueLabel
    ) where BoundValueLabel == EmptyView {
        self.value = value
        self.range = 0 ... 1
        self.label = label
        self.currentValueLabel = currentValueLabel
        self.minimumValueLabel = nil
        self.maximumValueLabel = nil
    }

    // MARK: Init – value + in range + label + currentValueLabel
    public init(
        value: Double,
        in range: ClosedRange<Double>,
        @ViewBuilder label: @escaping () -> GaugeLabel,
        @ViewBuilder currentValueLabel: @escaping () -> CurrentValueLabel
    ) where BoundValueLabel == EmptyView {
        self.value = value
        self.range = range
        self.label = label
        self.currentValueLabel = currentValueLabel
        self.minimumValueLabel = nil
        self.maximumValueLabel = nil
    }

    // MARK: Init – value + in range + label + current/min/max value labels
    public init(
        value: Double,
        in range: ClosedRange<Double>,
        @ViewBuilder label: @escaping () -> GaugeLabel,
        @ViewBuilder currentValueLabel: @escaping () -> CurrentValueLabel,
        @ViewBuilder minimumValueLabel: @escaping () -> BoundValueLabel,
        @ViewBuilder maximumValueLabel: @escaping () -> BoundValueLabel
    ) {
        self.value = value
        self.range = range
        self.label = label
        self.currentValueLabel = currentValueLabel
        self.minimumValueLabel = minimumValueLabel
        self.maximumValueLabel = maximumValueLabel
    }

    @ViewBuilder
    public var body: some View {
        #if os(iOS) || os(macOS) || os(watchOS) || os(visionOS)
        if #available(iOS 16.0, macOS 13.0, watchOS 9.0, visionOS 1.0, *) {
            nativeGauge
        } else {
            fallbackGauge
        }
        #else
        fallbackGauge
        #endif
    }

    #if os(iOS) || os(macOS) || os(watchOS) || os(visionOS)
    @available(iOS 16.0, macOS 13.0, watchOS 9.0, visionOS 1.0, *)
    @ViewBuilder
    private var nativeGauge: some View {
        if let currentValueLabel, let minimumValueLabel, let maximumValueLabel {
            Gauge(value: value, in: range) {
                label()
            } currentValueLabel: {
                currentValueLabel()
            } minimumValueLabel: {
                minimumValueLabel()
            } maximumValueLabel: {
                maximumValueLabel()
            }
        } else if let currentValueLabel {
            Gauge(value: value, in: range) {
                label()
            } currentValueLabel: {
                currentValueLabel()
            }
        } else {
            Gauge(value: value, in: range) {
                label()
            }
        }
    }
    #endif

    @ViewBuilder
    private var fallbackGauge: some View {
        VStack(alignment: .leading, spacing: 4) {
            label()
            ProgressView(value: normalizedValue)
            HStack {
                minimumValueLabel?()
                Spacer()
                currentValueLabel?()
                Spacer()
                maximumValueLabel?()
            }
            .font(.caption)
        }
    }

    private var normalizedValue: Double {
        let span = range.upperBound - range.lowerBound
        guard span > 0 else { return 0 }
        return min(max((value - range.lowerBound) / span, 0), 1)
    }
}


// MARK: - AdaptiveControlGroup

public struct AdaptiveControlGroup<Content: View>: View {
    private let content: () -> Content
    private let label: (() -> AnyView)?
    private let usesNativeLabeledControlGroup: Bool

    public init(
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.content = content
        self.label = nil
        self.usesNativeLabeledControlGroup = false
    }

    public init(
        _ titleKey: LocalizedStringKey,
        systemImage: String,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.content = content
        self.label = {
            AnyView(SwiftUI.Label(titleKey, systemImage: systemImage))
        }
        self.usesNativeLabeledControlGroup = true
    }

    public init<Label: View>(
        @ViewBuilder content: @escaping () -> Content,
        @ViewBuilder label: @escaping () -> Label
    ) {
        self.content = content
        self.label = {
            AnyView(label())
        }
        self.usesNativeLabeledControlGroup = true
    }

    @ViewBuilder
    public var body: some View {
        #if os(iOS) || os(macOS) || os(tvOS) || os(visionOS)
        if #available(iOS 15.0, macOS 12.0, tvOS 17.0, visionOS 1.0, *) {
            if usesNativeLabeledControlGroup {
                if #available(iOS 16.0, macOS 13.0, tvOS 17.0, visionOS 1.0, *) {
                    ControlGroup {
                        content()
                    } label: {
                        if let label {
                            label()
                        }
                    }
                } else {
                    fallbackControlGroup
                }
            } else {
                ControlGroup {
                    content()
                }
            }
        } else {
            fallbackControlGroup
        }
        #else
        fallbackControlGroup
        #endif
    }

    @ViewBuilder
    private var fallbackControlGroup: some View {
        if let label {
            VStack(alignment: .leading, spacing: 4) {
                label()
                    .font(.caption)
                HStack(spacing: 4) {
                    content()
                }
            }
        } else {
            HStack(spacing: 4) {
                content()
            }
        }
    }
}

public struct AdaptiveControlGroupTitled<Content: View>: View {
    private let titleKey: LocalizedStringKey
    private let systemImage: String
    private let content: () -> Content

    public init(
        _ titleKey: LocalizedStringKey,
        systemImage: String,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.titleKey = titleKey
        self.systemImage = systemImage
        self.content = content
    }

    @ViewBuilder
    public var body: some View {
        AdaptiveControlGroup(titleKey, systemImage: systemImage, content: content)
    }
}

public struct AdaptiveControlGroupLabeled<Content: View, Label: View>: View {
    private let content: () -> Content
    private let label: () -> Label

    public init(
        @ViewBuilder content: @escaping () -> Content,
        @ViewBuilder label: @escaping () -> Label
    ) {
        self.content = content
        self.label = label
    }

    @ViewBuilder
    public var body: some View {
        AdaptiveControlGroup(content: content, label: label)
    }
}

public extension View {
    @ViewBuilder
    func adaptiveButtonSizing(_ sizing: AdaptiveButtonSizing) -> some View {
        if #available(iOS 26.0, macOS 26.0, tvOS 26.0, watchOS 26.0, visionOS 26.0, *) {
            switch sizing {
            case .automatic:
                self.buttonSizing(.automatic)
            case .fitted:
                self.buttonSizing(.fitted)
            case .flexible:
                self.buttonSizing(.flexible)
            }
        } else {
            switch sizing {
            case .flexible:
                self.frame(maxWidth: .infinity)
            case .automatic, .fitted:
                self
            }
        }
    }

    @ViewBuilder
    func adaptiveButtonStyle(_ style: AdaptiveButtonStyle) -> some View {
        switch style {
        case .automatic:
            self.buttonStyle(.automatic)
        case .plain:
            self.buttonStyle(.plain)
        case .borderless:
            self.buttonStyle(.borderless)
        case .bordered:
            self.buttonStyle(.bordered)
        case .borderedProminent:
            self.buttonStyle(.borderedProminent)
        case .glass:
            if #available(iOS 26.0, macOS 26.0, tvOS 26.0, watchOS 26.0, visionOS 26.0, *) {
                self.buttonStyle(.glass)
            } else {
                self.buttonStyle(.bordered)
            }
        case .glassProminent:
            if #available(iOS 26.0, macOS 26.0, tvOS 26.0, watchOS 26.0, visionOS 26.0, *) {
                self.buttonStyle(.glassProminent)
            } else {
                self.buttonStyle(.borderedProminent)
            }
        }
    }

    @ViewBuilder
    func adaptiveControlSize(_ size: AdaptiveControlSize) -> some View {
        #if os(iOS) || os(macOS) || os(tvOS) || os(watchOS) || os(visionOS)
        if #available(iOS 15.0, macOS 10.15, tvOS 15.0, watchOS 9.0, visionOS 1.0, *) {
            switch size {
            case .mini:
                self.controlSize(.mini)
            case .small:
                self.controlSize(.small)
            case .regular:
                self.controlSize(.regular)
            case .large:
                self.controlSize(.large)
            case .extraLarge:
                #if os(visionOS)
                if #available(visionOS 1.0, *) {
                    self.controlSize(.extraLarge)
                } else {
                    self.controlSize(.large)
                }
                #else
                self.controlSize(.large)
                #endif
            }
        } else {
            self
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    func adaptiveButtonTint(_ tint: Color?) -> some View {
        if let tint {
            if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, visionOS 1.0, *) {
                self.tint(tint)
            } else {
                self
            }
        } else {
            self
        }
    }

    @ViewBuilder
    func adaptiveButtonBorderShape(_ shape: AdaptiveButtonBorderShape) -> some View {
        #if os(iOS) || os(macOS) || os(tvOS) || os(watchOS) || os(visionOS)
        switch shape {
        case .automatic:
            self
        case .roundedRectangle:
            if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, visionOS 1.0, *) {
                self.buttonBorderShape(.roundedRectangle)
            } else {
                self
            }
        case .capsule:
            if #available(iOS 15.0, macOS 14.0, tvOS 17.0, watchOS 8.0, visionOS 1.0, *) {
                self.buttonBorderShape(.capsule)
            } else {
                self
            }
        case .circle:
            if #available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, visionOS 1.0, *) {
                self.buttonBorderShape(.circle)
            } else {
                self.clipShape(Circle())
            }
        case let .roundedRectangleRadius(radius):
            if #available(iOS 15.0, macOS 14.0, tvOS 17.0, watchOS 8.0, visionOS 1.0, *) {
                self.buttonBorderShape(.roundedRectangle(radius: radius))
            } else {
                self
            }
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    func adaptiveMaterialBackground(
        _ material: AdaptiveMaterialStyle,
        cornerRadius: CGFloat = 12
    ) -> some View {
        if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 10.0, visionOS 1.0, *) {
            self.background(
                material.shapeStyle,
                in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            )
        } else {
            self
        }
    }

    @ViewBuilder
    func adaptiveForegroundStyle(
        _ color: Color,
        variant: AdaptiveHierarchicalVariant = .primary
    ) -> some View {
        switch variant {
        case .primary:
            if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, visionOS 1.0, *) {
                self.foregroundStyle(color)
            } else {
                self.foregroundColor(color)
            }
        case .secondary:
            if #available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, visionOS 1.0, *) {
                self.foregroundStyle(color.secondary)
            } else if #available(iOS 15.0, tvOS 15.0, watchOS 8.0, *) {
                self.foregroundStyle(color.opacity(0.6))
            } else {
                self.foregroundColor(color.opacity(0.6))
            }
        case .tertiary:
            if #available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, visionOS 1.0, *) {
                self.foregroundStyle(color.tertiary)
            } else if #available(iOS 15.0, tvOS 15.0, watchOS 8.0, *) {
                self.foregroundStyle(color.opacity(0.4))
            } else {
                self.foregroundColor(color.opacity(0.4))
            }
        case .quaternary:
            if #available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, visionOS 1.0, *) {
                self.foregroundStyle(color.quaternary)
            } else if #available(iOS 15.0, tvOS 15.0, watchOS 8.0, *) {
                self.foregroundStyle(color.opacity(0.25))
            } else {
                self.foregroundColor(color.opacity(0.25))
            }
        case .quinary:
            if #available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, visionOS 1.0, *) {
                self.foregroundStyle(color.quinary)
            } else if #available(iOS 15.0, tvOS 15.0, watchOS 8.0, *) {
                self.foregroundStyle(color.opacity(0.15))
            } else {
                self.foregroundColor(color.opacity(0.15))
            }
        }
    }

    @ViewBuilder
    func adaptiveControlGroupStyle(_ style: AdaptiveControlGroupStyle) -> some View {
        #if os(iOS) || os(macOS) || os(tvOS) || os(visionOS)
        if #available(iOS 15.0, macOS 12.0, tvOS 17.0, visionOS 1.0, *) {
            switch style {
            case .automatic:
                self.controlGroupStyle(.automatic)
            case .navigation:
                #if os(tvOS)
                self.controlGroupStyle(.automatic)
                #else
                self.controlGroupStyle(.navigation)
                #endif
            case .menu:
                if #available(iOS 16.4, macOS 13.3, *) {
                    self.controlGroupStyle(.menu)
                } else {
                    self.controlGroupStyle(.automatic)
                }
            case .compactMenu:
                if #available(iOS 16.4, macOS 13.3, *) {
                    #if os(iOS) || os(macOS) || os(visionOS)
                    self.controlGroupStyle(.compactMenu)
                    #else
                    self.controlGroupStyle(.automatic)
                    #endif
                } else {
                    self.controlGroupStyle(.automatic)
                }
            case .palette:
                if #available(iOS 17.0, macOS 14.0, *) {
                    #if os(iOS) || os(macOS) || os(visionOS)
                    self.controlGroupStyle(.palette)
                    #else
                    self.controlGroupStyle(.automatic)
                    #endif
                } else {
                    self.controlGroupStyle(.automatic)
                }
            }
        } else {
            self
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    func adaptiveGaugeStyle(_ style: AdaptiveGaugeStyle) -> some View {
        #if os(iOS) || os(macOS) || os(watchOS) || os(visionOS)
        if #available(iOS 16.0, macOS 13.0, watchOS 9.0, visionOS 1.0, *) {
            switch style {
            case .automatic:
                self.gaugeStyle(.automatic)
            case .linear:
                #if os(watchOS)
                self.gaugeStyle(.linear)
                #else
                self.gaugeStyle(.automatic)
                #endif
            case .circular:
                #if os(watchOS)
                self.gaugeStyle(.circular)
                #else
                self.gaugeStyle(.automatic)
                #endif
            case .accessoryLinear:
                self.gaugeStyle(.accessoryLinear)
            case .accessoryLinearCapacity:
                self.gaugeStyle(.accessoryLinearCapacity)
            case .linearCapacity:
                self.gaugeStyle(.linearCapacity)
            case .accessoryCircular:
                self.gaugeStyle(.accessoryCircular)
            case .accessoryCircularCapacity:
                self.gaugeStyle(.accessoryCircularCapacity)
            }
        } else {
            self
        }
        #else
        self
        #endif
    }
}

@available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 10.0, visionOS 1.0, *)
private extension AdaptiveMaterialStyle {
    var shapeStyle: Material {
        switch self {
        case .ultraThin:
            return .ultraThinMaterial
        case .thin:
            return .thinMaterial
        case .regular:
            return .regularMaterial
        case .thick:
            return .thickMaterial
        case .ultraThick:
            return .ultraThickMaterial
        }
    }
}
