import SwiftUI


extension View {
    @ViewBuilder
    public func adaptiveGaugeStyle(_ style: AdaptiveGaugeStyle) -> some View {
        switch style {
        case .automatic:
            self.gaugeStyle(.automatic)
        case .linear:
            #if os(watchOS)
            self.gaugeStyle(.linear)
            #else
            self.gaugeStyle(.automatic)
            #endif
        case .linearCapacity:
            #if os(iOS) || os(macOS) || os(watchOS) || os(visionOS)
            if #available(iOS 16.0, macOS 13.0, watchOS 9.0, visionOS 1.0, *) {
                self.gaugeStyle(.linearCapacity)
            } else {
                self
            }
            #else
            self
            #endif
        case .circular:
            #if os(watchOS)
            self.gaugeStyle(.circular)
            #else
            self.gaugeStyle(.automatic)
            #endif
        case .accessoryLinear:
            #if os(iOS) || os(macOS) || os(watchOS) || os(visionOS)
            if #available(iOS 16.0, macOS 13.0, watchOS 9.0, visionOS 1.0, *) {
                self.gaugeStyle(.accessoryLinear)
            } else {
                self
            }
            #else
            self
            #endif
        case .accessoryLinearCapacity:
            #if os(iOS) || os(macOS) || os(watchOS) || os(visionOS)
            if #available(iOS 16.0, macOS 13.0, watchOS 9.0, visionOS 1.0, *) {
                self.gaugeStyle(.accessoryLinearCapacity)
            } else {
                self
            }
            #else
            self
            #endif
        case .accessoryCircular:
            #if os(iOS) || os(macOS) || os(watchOS) || os(visionOS)
            if #available(iOS 16.0, macOS 13.0, watchOS 9.0, visionOS 1.0, *) {
                self.gaugeStyle(.accessoryCircular)
            } else {
                self
            }
            #else
            self
            #endif
        case .accessoryCircularCapacity:
            #if os(iOS) || os(macOS) || os(watchOS) || os(visionOS)
            if #available(iOS 16.0, macOS 13.0, watchOS 9.0, visionOS 1.0, *) {
                self.gaugeStyle(.accessoryCircularCapacity)
            } else {
                self
            }
            #else
            self
            #endif
        }
    }

    @ViewBuilder
    public func adaptiveGaugeTint<S: ShapeStyle>(_ style: S) -> some View {
        #if os(iOS) || os(macOS) || os(watchOS) || os(visionOS)
        if #available(iOS 16.0, macOS 13.0, watchOS 9.0, visionOS 1.0, *) {
            self.tint(style)
        } else {
            self
        }
        #else
        self
        #endif
    }
}
