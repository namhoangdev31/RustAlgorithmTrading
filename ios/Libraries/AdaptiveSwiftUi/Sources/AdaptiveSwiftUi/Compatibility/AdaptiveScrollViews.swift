import SwiftUI

public extension View {
    
    /// Applies an adaptive scroll edge effect style to a scrollable view.
    ///
    /// This modifier allows you to customize the visual feedback when scrolling reaches the 
    /// boundary of the content. 
    ///
    /// - Parameters:
    ///   - style: The adaptive style to apply (currently supporting `.hard` for future iOS 26+).
    ///   - edges: The set of edges to apply the effect to. Default is `.all`.
    ///
    /// - Platforms Supported: iOS 26.0+, macOS 26.0+, watchOS 26.0+, tvOS 26.0+, visionOS 26.0+.
    /// - Fallback Behavior: On older OS versions, it gracefully preserves the default system 
    ///   scroll edge effect (typically rubber-banding/bouncing) to maintain platform-specific UX.
    ///
    /// Example:
    /// ```swift
    /// ScrollView(.horizontal) {
    ///     HStack { ... }
    /// }
    /// .adaptiveScrollEdgeEffectStyle(.hard, for: .horizontal)
    /// ```
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
