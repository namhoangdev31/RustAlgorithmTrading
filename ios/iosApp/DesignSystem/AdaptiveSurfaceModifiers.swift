import SwiftUI

enum AdaptiveGlassButtonVariant {
    case regular
    case prominent
}

struct AdaptiveGlassContainer<Content: View>: View {
    private let spacing: CGFloat
    private let content: () -> Content

    init(
        spacing: CGFloat = 24,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.spacing = spacing
        self.content = content
    }

    @ViewBuilder
    var body: some View {
        if #available(iOS 26.0, macOS 26.0, watchOS 26.0, tvOS 26.0, visionOS 26.0, *) {
            GlassEffectContainer(spacing: spacing) {
                content()
            }
        } else {
            content()
        }
    }
}

extension View {
    // Unified surface effect: WWDC25 Liquid Glass on OS 26+, material fallback on legacy OS.
    @ViewBuilder
    func adaptiveGlass(
        cornerRadius: CGFloat = 20,
        tint: Color? = nil,
        interactive: Bool = false,
        fallbackMaterial: Material = .ultraThinMaterial
    ) -> some View {
        if #available(iOS 26.0, macOS 26.0, watchOS 26.0, tvOS 26.0, visionOS 26.0, *) {
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
                .background(
                    fallbackMaterial,
                    in: RoundedRectangle(
                        cornerRadius: cornerRadius,
                        style: .continuous
                    )
                )
                .shadow(color: .black.opacity(0.08), radius: 10, x: 0, y: 4)
        }
    }

    // Unified button skin for new and legacy OS versions.
    @ViewBuilder
    func adaptiveGlassButton(
        cornerRadius: CGFloat = 20,
        variant: AdaptiveGlassButtonVariant = .regular
    ) -> some View {
        if #available(iOS 26.0, macOS 26.0, watchOS 26.0, tvOS 26.0, visionOS 26.0, *) {
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

    // No-op on legacy OS, enabled on WWDC25-capable builds.
    @ViewBuilder
    func adaptiveBackgroundExtension() -> some View {
        if #available(iOS 26.0, macOS 26.0, watchOS 26.0, tvOS 26.0, visionOS 26.0, *) {
            self.backgroundExtensionEffect()
        } else {
            self
        }
    }

    // iPhone tab bar minimize behavior on iOS 26+ only.
    @ViewBuilder
    func adaptiveTabBarMinimizeOnScroll() -> some View {
        #if os(iOS)
        if #available(iOS 26.0, *) {
            self.tabBarMinimizeBehavior(.onScrollDown)
        } else {
            self
        }
        #else
        self
        #endif
    }
}
