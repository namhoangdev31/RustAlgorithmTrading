import SwiftUI

/// A custom environment key to propagate `AdaptiveControlGroupStyle` through the view hierarchy.
struct AdaptiveControlGroupStyleKey: EnvironmentKey {
    static let defaultValue: AdaptiveControlGroupStyle = .automatic
}

public extension EnvironmentValues {
    /// Accessor for the adaptive control group style in the environment.
    var adaptiveControlGroupStyle: AdaptiveControlGroupStyle {
        get { self[AdaptiveControlGroupStyleKey.self] }
        set { self[AdaptiveControlGroupStyleKey.self] = newValue }
    }
}

public extension View {
    /// Applies a style to all `ControlGroup` and `AdaptiveControlGroup` components within this view.
    ///
    /// This modifier handles cross-platform styling for control groups:
    /// - **iOS 15+ / macOS 12+**: Maps to native `.controlGroupStyle()` for standard components.
    /// - **Legacy/Fallback**: Saves the style to the environment, allowing `AdaptiveControlGroup`
    ///   to replicate the visual style using alternative layouts (like `HStack` or `Menu`) on older OS versions.
    ///
    /// - Parameter style: The adaptive style to apply (e.g., `.navigation`, `.menu`, `.palette`).
    ///
    /// Example:
    /// ```swift
    /// AdaptiveControlGroup {
    ///     Button("Edit") { }
    ///     Button("Delete") { }
    /// }
    /// .adaptiveControlGroupStyle(.menu)
    /// ```
    @ViewBuilder
    func adaptiveControlGroupStyle(_ style: AdaptiveControlGroupStyle) -> some View {
        let styled = self.environment(\.adaptiveControlGroupStyle, style)
        
        #if os(iOS) || os(macOS) || os(tvOS) || os(visionOS) || os(watchOS)
        if #available(iOS 15.0, macOS 12.0, tvOS 17.0, visionOS 1.0, *) {
            #if !os(watchOS)
            switch style {
            case .automatic:
                styled.controlGroupStyle(.automatic)
            case .palette:
                if #available(iOS 17.0, macOS 14.0, *) {
                    styled.controlGroupStyle(.palette)
                } else {
                    styled
                }
            case .navigation:
                styled.controlGroupStyle(.navigation)
            case .menu:
                if #available(iOS 16.4, macOS 13.3, tvOS 17.0, *) {
                    styled.controlGroupStyle(.menu)
                } else {
                    styled
                }
            case .compactMenu:
                if #available(iOS 16.4, macOS 13.3, *) {
                    styled.controlGroupStyle(.compactMenu)
                } else {
                    styled
                }
            }
            #else
            styled
            #endif
        } else {
            styled
        }
        #else
        styled
        #endif
    }
}
