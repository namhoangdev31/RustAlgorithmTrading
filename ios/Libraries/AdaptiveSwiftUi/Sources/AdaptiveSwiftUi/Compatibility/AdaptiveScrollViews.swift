import SwiftUI

public enum AdaptiveScrollEdgeEffectStyle: Sendable {
    case hard
}

public extension View {
    /// Applies a scroll edge effect style.
    /// Uses the `.scrollEdgeEffectStyle` modifier available natively on iOS 26.0+
    /// Falls back to the default scroll edge effect (rubber-banding) on older versions.
    @ViewBuilder
    func adaptiveScrollEdgeEffectStyle(_ style: AdaptiveScrollEdgeEffectStyle, for edges: Edge.Set = .all) -> some View {
        #if os(iOS) || os(macOS) || os(watchOS) || os(tvOS) || os(visionOS)
        if #available(iOS 26.0, macOS 26.0, watchOS 26.0, tvOS 26.0, visionOS 26.0, *) {
            switch style {
            case .hard:
                self.scrollEdgeEffectStyle(.hard, for: edges)
            }
        } else {
            self
        }
        #else
        self
        #endif
    }
}
