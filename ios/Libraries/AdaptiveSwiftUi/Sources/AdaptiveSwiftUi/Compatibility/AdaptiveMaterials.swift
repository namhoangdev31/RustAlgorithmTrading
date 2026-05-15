import SwiftUI

public extension View {
    
    /// Applies an adaptive material as the background of the view.
    /// On iOS 15+, uses native SwiftUI `.background(.regularMaterial)`.
    /// On iOS 13/14, falls back to `UIVisualEffectView`.
    @ViewBuilder
    func adaptiveBackgroundMaterial(_ type: AdaptiveMaterialType = .regular) -> some View {
        self.background(AdaptiveMaterial(type))
    }
    
    /// Applies an adaptive material as the foreground style of the view.
    /// On iOS 15+, uses native SwiftUI `.foregroundStyle(.regularMaterial)`.
    /// On older OS versions where foreground materials are unsupported, it falls back
    /// to scaled hierarchical colors to approximate the visual hierarchy.
    @ViewBuilder
    func adaptiveForegroundMaterial(_ type: AdaptiveMaterialType = .regular) -> some View {
        #if os(iOS) || os(macOS) || os(tvOS) || os(visionOS) || os(watchOS)
        if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, visionOS 1.0, *) {
            switch type {
            case .ultraThin: self.foregroundStyle(.ultraThinMaterial)
            case .thin: self.foregroundStyle(.thinMaterial)
            case .regular: self.foregroundStyle(.regularMaterial)
            case .thick: self.foregroundStyle(.thickMaterial)
            case .ultraThick: self.foregroundStyle(.ultraThickMaterial)
            }
        } else {
            // Foreground material fallback using opacity on secondary/primary colors.
            // This ensures text remains readable without native support.
            switch type {
            case .ultraThin: self.foregroundColor(Color.secondary.opacity(0.3))
            case .thin: self.foregroundColor(Color.secondary.opacity(0.5))
            case .regular: self.foregroundColor(Color.secondary.opacity(0.7))
            case .thick: self.foregroundColor(Color.secondary.opacity(0.9))
            case .ultraThick: self.foregroundColor(Color.primary)
            }
        }
        #else
        self.foregroundColor(Color.primary)
        #endif
    }
}
