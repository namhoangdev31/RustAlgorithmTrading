import SwiftUI

/// A container that combines multiple Liquid Glass shapes into a single morphing structure.
///
/// `AdaptiveGlassEffectContainer` provides a unified layout for components with glass effects:
/// - **Modern OS (iOS 26+)**: Uses the native `GlassEffectContainer` which allows individual 
///   glass shapes to visually morph and blend into one another.
/// - **Legacy Fallback**: Falls back to a standard `VStack` to maintain the intended vertical 
///   layout on older systems or platforms where liquid glass is unavailable (like visionOS).
///
/// Example:
/// ```swift
/// AdaptiveGlassEffectContainer(spacing: 20) {
///     Text("Top Item").adaptiveGlassEffect()
///     Text("Bottom Item").adaptiveGlassEffect()
/// }
/// ```
public struct AdaptiveGlassEffectContainer<Content: View>: View {
    public var spacing: CGFloat?
    @ViewBuilder public var content: () -> Content

    /// Creates an adaptive glass effect container.
    ///
    /// - Parameters:
    ///   - spacing: The distance between the elements inside the container.
    ///   - content: A view builder describing the elements to be contained.
    public init(spacing: CGFloat? = nil, @ViewBuilder content: @escaping () -> Content) {
        self.spacing = spacing
        self.content = content
    }

    public var body: some View {
        #if !os(visionOS)
        if #available(iOS 26.0, macOS 26.0, watchOS 26.0, tvOS 26.0, *) {
            GlassEffectContainer(spacing: spacing) {
                content()
            }
        } else {
            fallback
        }
        #else
        fallback
        #endif
    }
    
    @ViewBuilder
    private var fallback: some View {
        if let spacing = spacing {
            VStack(spacing: spacing) {
                content()
            }
        } else {
            VStack {
                content()
            }
        }
    }
}
