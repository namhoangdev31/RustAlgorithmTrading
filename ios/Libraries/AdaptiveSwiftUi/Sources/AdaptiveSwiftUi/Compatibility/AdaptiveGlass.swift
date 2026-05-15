import SwiftUI

/// A container that provides a dedicated environment for glass effects on supported systems.
///
/// On iOS 26+ and other modern platforms, this wraps content in a native `GlassEffectContainer`.
/// On older versions, it simply renders the content as-is.
///
/// Example:
/// ```swift
/// AdaptiveGlassContainer {
///     Text("Hello Glass")
/// }
/// ```
public struct AdaptiveGlassContainer<Content: View>: View {
    private let spacing: CGFloat
    private let content: () -> Content

    public init(
        spacing: CGFloat = 24,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.spacing = spacing
        self.content = content
    }

    @ViewBuilder
    public var body: some View {
        if #available(iOS 26.0, macOS 26.0, tvOS 26.0, watchOS 26.0, visionOS 26.0, *) {
            GlassEffectContainer(spacing: spacing) {
                content()
            }
        } else {
            content()
        }
    }
}

extension View {
    
    /// Applies a glass effect to the view with intelligent backward compatibility.
    ///
    /// - Parameters:
    ///   - cornerRadius: The radius for the rounded corners. Default is 20.
    ///   - tint: An optional color tint to apply to the glass.
    ///   - interactive: Whether the glass effect responds to interaction.
    ///   - fallbackMaterial: The material to use as a fallback on older OS versions.
    ///   - fallbackShadowRadius: The shadow radius to apply on older versions to mimic depth.
    ///
    /// Example:
    /// ```swift
    /// MyView()
    ///     .adaptiveGlass(cornerRadius: 16, tint: .blue.opacity(0.2))
    /// ```
    @ViewBuilder
    public func adaptiveGlass(
        cornerRadius: CGFloat = 20,
        tint: Color? = nil,
        interactive: Bool = false,
        fallbackMaterial: AdaptiveMaterialStyle = .ultraThin,
        fallbackShadowRadius: CGFloat = 10
    ) -> some View {
        if #available(iOS 26.0, macOS 26.0, tvOS 26.0, watchOS 26.0, visionOS 26.0, *) {
            let configuredGlass: Glass = {
                var value = Glass.regular
                if let tint {
                    value = value.tint(tint)
                }
                if interactive {
                    value = value.interactive()
                }
                return value
            }()

            self
                .glassEffect(
                    configuredGlass,
                    in: RoundedRectangle(
                        cornerRadius: cornerRadius,
                        style: .continuous
                    )
                )
        } else {
            self
                .adaptiveMaterialBackground(fallbackMaterial, cornerRadius: cornerRadius)
                .shadow(
                    color: .black.opacity(0.08),
                    radius: fallbackShadowRadius,
                    x: 0,
                    y: fallbackShadowRadius * 0.4
                )
        }
    }

    /// Configures a button with a glass visual style.
    ///
    /// Maps to `.glass` styles on iOS 26+ and falls back to a prominent bordered style on older systems.
    ///
    /// Example:
    /// ```swift
    /// Button("Action") {}
    ///     .adaptiveGlassButton(.prominent)
    /// ```
    @ViewBuilder
    public func adaptiveGlassButton(
        _ variant: AdaptiveGlassButtonVariant = .regular,
        cornerRadius: CGFloat = 20
    ) -> some View {
        if #available(iOS 26.0, macOS 26.0, tvOS 26.0, watchOS 26.0, visionOS 26.0, *) {
            switch variant {
            case .regular:
                self.buttonStyle(.glass)
            case .prominent:
                self.buttonStyle(.glassProminent)
            }
        } else {
            self
                .buttonStyle(.borderedProminent)
                .clipShape(
                    RoundedRectangle(
                        cornerRadius: cornerRadius,
                        style: .continuous
                    )
                )
        }
    }

    /// Enables or disables the background extension effect (iOS 26+).
    @ViewBuilder
    public func adaptiveBackgroundExtension(isEnabled: Bool = true) -> some View {
        if #available(iOS 26.0, macOS 26.0, tvOS 26.0, watchOS 26.0, visionOS 26.0, *) {
            self.backgroundExtensionEffect(isEnabled: isEnabled)
        } else {
            self
        }
    }
}
