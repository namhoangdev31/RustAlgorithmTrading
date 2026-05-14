import SwiftUI

public enum AdaptiveGlassButtonVariant: Sendable {
    case regular
    case prominent
}

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

public extension View {
    @ViewBuilder
    func adaptiveGlass(
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

    @ViewBuilder
    func adaptiveGlassButton(
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

    @ViewBuilder
    func adaptiveBackgroundExtension(isEnabled: Bool = true) -> some View {
        if #available(iOS 26.0, macOS 26.0, tvOS 26.0, watchOS 26.0, visionOS 26.0, *) {
            self.backgroundExtensionEffect(isEnabled: isEnabled)
        } else {
            self
        }
    }
}
