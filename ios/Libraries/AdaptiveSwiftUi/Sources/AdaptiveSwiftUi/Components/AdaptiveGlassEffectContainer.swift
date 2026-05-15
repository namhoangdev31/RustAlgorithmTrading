import SwiftUI

/// A container that combines multiple Liquid Glass shapes into a single shape that can morph individual shapes into one another.
/// Uses the native `GlassEffectContainer` on iOS 26.0+ (excluding visionOS).
/// Falls back to a standard `VStack` on older platforms.
public struct AdaptiveGlassEffectContainer<Content: View>: View {
    public var spacing: CGFloat?
    @ViewBuilder public var content: () -> Content

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
