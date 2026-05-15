import SwiftUI


public extension View {
    /// Applies a foreground style with optional gradient, hierarchy, and opacity.
    /// This seamlessly polyfills iOS 15/16 color variants, gradients, and hierarchical
    /// shape styles while safely falling back to calculated `.foregroundColor()` on iOS 13/14.
    @ViewBuilder
    func adaptiveForegroundStyle(
        _ color: Color,
        gradient: Bool = false,
        hierarchy: AdaptiveColorHierarchy = .primary,
        opacity: Double = 1.0
    ) -> some View {
        #if os(iOS) || os(macOS) || os(watchOS) || os(tvOS) || os(visionOS)
        if #available(iOS 17.0, macOS 14.0, watchOS 10.0, tvOS 17.0, visionOS 1.0, *) {
            if gradient {
                switch hierarchy {
                case .primary: self.foregroundStyle(color.gradient.opacity(opacity))
                case .secondary: self.foregroundStyle(color.gradient.secondary.opacity(opacity))
                case .tertiary: self.foregroundStyle(color.gradient.tertiary.opacity(opacity))
                case .quaternary: self.foregroundStyle(color.gradient.quaternary.opacity(opacity))
                case .quinary: self.foregroundStyle(color.gradient.quinary.opacity(opacity))
                }
            } else {
                switch hierarchy {
                case .primary: self.foregroundStyle(color.opacity(opacity))
                case .secondary: self.foregroundStyle(color.secondary.opacity(opacity))
                case .tertiary: self.foregroundStyle(color.tertiary.opacity(opacity))
                case .quaternary: self.foregroundStyle(color.quaternary.opacity(opacity))
                case .quinary: self.foregroundStyle(color.quinary.opacity(opacity))
                }
            }
        } else if #available(iOS 16.0, macOS 13.0, watchOS 9.0, tvOS 16.0, visionOS 1.0, *) {
            if gradient {
                // iOS 16 supports gradient but not hierarchical modifiers on it.
                self.foregroundStyle(color.gradient.opacity(opacity * hierarchy.simulatedOpacity))
            } else {
                self.foregroundStyle(color.opacity(opacity * hierarchy.simulatedOpacity))
            }
        } else if #available(iOS 15.0, macOS 12.0, watchOS 8.0, tvOS 15.0, *) {
            // iOS 15 Fallback
            self.foregroundStyle(color.opacity(opacity * hierarchy.simulatedOpacity))
        } else {
            // iOS 13/14 Fallback
            self.foregroundColor(color.opacity(opacity * hierarchy.simulatedOpacity))
        }
        #else
        self.foregroundColor(color.opacity(opacity))
        #endif
    }
}

private extension AdaptiveColorHierarchy {
    var simulatedOpacity: Double {
        switch self {
        case .primary: return 1.0
        case .secondary: return 0.8
        case .tertiary: return 0.6
        case .quaternary: return 0.4
        case .quinary: return 0.2
        }
    }
}
