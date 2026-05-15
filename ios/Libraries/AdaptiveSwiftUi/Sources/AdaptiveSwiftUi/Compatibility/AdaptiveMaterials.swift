import SwiftUI

public extension View {
    
    /// Applies an adaptive material as the background of the view with cross-platform support.
    ///
    /// This modifier handles background materials across different OS versions:
    /// - **iOS 15+**: Uses native SwiftUI `.background(.regularMaterial)`.
    /// - **iOS 13-14**: Falls back to a custom polyfill (like `UIVisualEffectView` via `AdaptiveMaterial`).
    ///
    /// - Parameter type: The thickness of the material (e.g., `.thin`, `.thick`). Default is `.regular`.
    ///
    /// Example:
    /// ```swift
    /// MyView()
    ///     .adaptiveBackgroundMaterial(.ultraThin)
    /// ```
    @ViewBuilder
    func adaptiveBackgroundMaterial(_ type: AdaptiveMaterialType = .regular) -> some View {
        self.background(AdaptiveMaterial(type))
    }
    
    /// Applies an adaptive material as the foreground style of the view.
    ///
    /// This modifier allows text and icons to pick up background colors through a material effect:
    /// - **iOS 15+**: Uses native SwiftUI `.foregroundStyle(.regularMaterial)`.
    /// - **Legacy Fallback**: Approximates the material hierarchy using `Color.secondary` with 
    ///   scaled opacity values (from 0.3 to 0.9) to ensure readability and visual hierarchy.
    ///
    /// - Parameter type: The thickness of the material. Default is `.regular`.
    ///
    /// Example:
    /// ```swift
    /// Text("Glass Text")
    ///     .font(.title)
    ///     .adaptiveForegroundMaterial(.thick)
    /// ```
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
