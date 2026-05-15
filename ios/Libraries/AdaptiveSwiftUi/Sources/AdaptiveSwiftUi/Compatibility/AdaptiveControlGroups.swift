import SwiftUI


struct AdaptiveControlGroupStyleKey: EnvironmentKey {
    static let defaultValue: AdaptiveControlGroupStyle = .automatic
}

public extension EnvironmentValues {
    var adaptiveControlGroupStyle: AdaptiveControlGroupStyle {
        get { self[AdaptiveControlGroupStyleKey.self] }
        set { self[AdaptiveControlGroupStyleKey.self] = newValue }
    }
}

public extension View {
    /// Applies a style to all `ControlGroup` and `AdaptiveControlGroup` components within this view.
    /// Safely maps to the native `.controlGroupStyle()` modifiers on iOS 15+, while saving
    /// the style in the environment for older versions to use in fallback rendering.
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
                if #available(iOS 16.4, macOS 13.3, *) {
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
