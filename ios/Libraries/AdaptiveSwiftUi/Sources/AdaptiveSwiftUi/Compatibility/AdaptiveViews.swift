import SwiftUI

/// An adaptive representation of `ControlSize` that falls back safely on older OS versions.

/// An adaptive representation of `ContainerBackgroundPlacement` that falls back safely.

extension View {

    // MARK: - ControlSize

    /// Applies a control size to the view.
    /// - Uses `.controlSize(_:)` on iOS 15.0+, macOS 10.15+, watchOS 9.0+, tvOS 15.0+, visionOS 1.0+
    /// - Falls back to doing nothing on older versions.
    @ViewBuilder
    public func adaptiveControlSize(_ size: AdaptiveControlSize) -> some View {
        if #available(iOS 15.0, macOS 10.15, tvOS 15.0, watchOS 9.0, visionOS 1.0, *) {
            self.controlSize(size.native)
        } else {
            self
        }
    }

    // MARK: - Background Extension Effect

    /// Adds the background extension effect to the view.
    /// Mirrored copies will be placed around the view on any edge with available safe area.
    /// - Uses `.backgroundExtensionEffect()` on iOS 26.0+, macOS 26.0+, watchOS 26.0+, tvOS 26.0+, visionOS 26.0+.
    /// - Falls back to doing nothing on older versions.
    @ViewBuilder
    public func adaptiveBackgroundExtensionEffect() -> some View {
        if #available(iOS 26.0, macOS 26.0, watchOS 26.0, tvOS 26.0, visionOS 26.0, *) {
            self.backgroundExtensionEffect()
        } else {
            self
        }
    }

    // MARK: - Glass Effect

    /// Applies the Liquid Glass effect to a view.
    /// - Uses `.glassEffect()` on iOS 26.0+, macOS 26.0+, watchOS 26.0+, tvOS 26.0+.
    /// - Falls back to doing nothing on older versions.
    @ViewBuilder
    public func adaptiveGlassEffect() -> some View {
        #if !os(visionOS)
            if #available(iOS 26.0, macOS 26.0, watchOS 26.0, tvOS 26.0, *) {
                self.glassEffect()
            } else {
                self
            }
        #else
            self
        #endif
    }

    /// Applies the Liquid Glass effect to a view within a specific shape.
    /// - Uses `.glassEffect(in:)` on iOS 26.0+, macOS 26.0+, watchOS 26.0+, tvOS 26.0+.
    /// - Falls back to doing nothing on older versions.
    @ViewBuilder
    public func adaptiveGlassEffect<S: Shape>(in shape: S) -> some View {
        #if !os(visionOS)
            if #available(iOS 26.0, macOS 26.0, watchOS 26.0, tvOS 26.0, *) {
                self.glassEffect(in: shape)
            } else {
                self
            }
        #else
            self
        #endif
    }
    // MARK: - Material Background

    @ViewBuilder
    public func adaptiveMaterialBackground(
        _ material: AdaptiveMaterialStyle,
        cornerRadius: CGFloat = 12
    ) -> some View {
        if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 10.0, visionOS 1.0, *) {
            self.background(
                material.shapeStyle,
                in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            )
        } else {
            self
        }
    }

    // MARK: - Hierarchical Foreground

    @ViewBuilder
    public func adaptiveForegroundStyle(
        _ color: Color,
        variant: AdaptiveHierarchicalVariant = .primary
    ) -> some View {
        switch variant {
        case .primary:
            if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, visionOS 1.0, *) {
                self.foregroundStyle(color)
            } else {
                self.foregroundColor(color)
            }
        case .secondary:
            if #available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, visionOS 1.0, *) {
                self.foregroundStyle(color.secondary)
            } else if #available(iOS 15.0, tvOS 15.0, watchOS 8.0, *) {
                self.foregroundStyle(color.opacity(0.6))
            } else {
                self.foregroundColor(color.opacity(0.6))
            }
        case .tertiary:
            if #available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, visionOS 1.0, *) {
                self.foregroundStyle(color.tertiary)
            } else if #available(iOS 15.0, tvOS 15.0, watchOS 8.0, *) {
                self.foregroundStyle(color.opacity(0.4))
            } else {
                self.foregroundColor(color.opacity(0.4))
            }
        case .quaternary:
            if #available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, visionOS 1.0, *) {
                self.foregroundStyle(color.quaternary)
            } else if #available(iOS 15.0, tvOS 15.0, watchOS 8.0, *) {
                self.foregroundStyle(color.opacity(0.25))
            } else {
                self.foregroundColor(color.opacity(0.25))
            }
        case .quinary:
            if #available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, visionOS 1.0, *) {
                self.foregroundStyle(color.quinary)
            } else if #available(iOS 15.0, tvOS 15.0, watchOS 8.0, *) {
                self.foregroundStyle(color.opacity(0.15))
            } else {
                self.foregroundColor(color.opacity(0.15))
            }
        }
    }
}

@available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 10.0, visionOS 1.0, *)
extension AdaptiveMaterialStyle {
    var shapeStyle: Material {
        switch self {
        case .ultraThin:
            return .ultraThinMaterial
        case .thin:
            return .thinMaterial
        case .regular:
            return .regularMaterial
        case .thick:
            return .thickMaterial
        case .ultraThick:
            return .ultraThickMaterial
        }
    }
}
