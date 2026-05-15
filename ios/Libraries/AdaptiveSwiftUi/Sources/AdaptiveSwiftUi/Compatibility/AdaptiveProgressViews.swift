import SwiftUI

public enum AdaptiveProgressViewStyle: Sendable {
    case automatic
    case linear
    case circular
}

extension View {
    @ViewBuilder
    public func adaptiveProgressViewStyle(_ style: AdaptiveProgressViewStyle) -> some View {
        switch style {
        case .automatic:
            self.progressViewStyle(.automatic)
        case .linear:
            #if os(iOS) || os(macOS) || os(watchOS) || os(tvOS) || os(visionOS)
            if #available(iOS 14.0, macOS 11.0, watchOS 7.0, tvOS 14.0, visionOS 1.0, *) {
                self.progressViewStyle(.linear)
            } else {
                self
            }
            #else
            self
            #endif
        case .circular:
            #if os(iOS) || os(macOS) || os(tvOS) || os(visionOS)
            if #available(iOS 14.0, macOS 11.0, tvOS 14.0, visionOS 1.0, *) {
                self.progressViewStyle(.circular)
            } else {
                self
            }
            #else
            self
            #endif
        }
    }

    @ViewBuilder
    public func adaptiveProgressTint(_ color: Color?) -> some View {
        if let color {
            if #available(iOS 15.0, macOS 12.0, watchOS 8.0, tvOS 15.0, *) {
                self.tint(color)
            } else {
                self.accentColor(color)
            }
        } else {
            self
        }
    }
}
