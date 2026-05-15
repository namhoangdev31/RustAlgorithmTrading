import SwiftUI

public extension View {
    
    /// Applies an adaptive foreground style with support for hierarchical variants and gradients.
    ///
    /// This modifier provides a unified API for modern SwiftUI coloring features while maintaining
    /// backward compatibility:
    /// - **iOS 17+**: Uses native hierarchical `foregroundStyle` with full gradient support.
    /// - **iOS 16**: Uses native `gradient` with simulated hierarchical opacity.
    /// - **iOS 13-15**: Uses `foregroundColor` or `foregroundStyle` with simulated opacity.
    ///
    /// - Parameters:
    ///   - color: The base color to apply.
    ///   - gradient: Whether to apply a gradient effect. Default is `false`.
    ///   - hierarchy: The hierarchical level (Primary to Quinary). Default is `.primary`.
    ///   - opacity: The global opacity to apply to the final style. Default is `1.0`.
    ///
    /// Example:
    /// ```swift
    /// Text("Hello")
    ///     .adaptiveForegroundStyle(.blue, gradient: true, hierarchy: .secondary)
    /// ```
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
                // We use simulated opacity to mimic hierarchy.
                self.foregroundStyle(color.gradient.opacity(opacity * hierarchy.simulatedOpacity))
            } else {
                self.foregroundStyle(color.opacity(opacity * hierarchy.simulatedOpacity))
            }
        } else if #available(iOS 15.0, macOS 12.0, watchOS 8.0, tvOS 15.0, *) {
            // iOS 15 Fallback
            self.foregroundStyle(color.opacity(opacity * hierarchy.simulatedOpacity))
        } else {
            // iOS 13/14 Fallback using standard foregroundColor
            self.foregroundColor(color.opacity(opacity * hierarchy.simulatedOpacity))
        }
        #else
        self.foregroundColor(color.opacity(opacity))
        #endif
    }
}

private extension AdaptiveColorHierarchy {
    /// Provides a fallback opacity value for hierarchical levels on older OS versions.
    /// These values approximate the visual difference between Primary, Secondary, etc.
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
