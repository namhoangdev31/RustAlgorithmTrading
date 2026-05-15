import SwiftUI

/// An adaptive representation of `ControlSize` that falls back safely on older OS versions.
public enum AdaptiveControlSize: Sendable {
    case mini
    case small
    case regular
    case large
    case extraLarge
    
    @available(iOS 15.0, macOS 10.15, tvOS 15.0, watchOS 9.0, visionOS 1.0, *)
    public var native: ControlSize {
        switch self {
        case .mini: return .mini
        case .small: return .small
        case .regular: return .regular
        case .large: return .large
        case .extraLarge:
            #if os(visionOS)
            return .extraLarge
            #else
            if #available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, *) {
                return .extraLarge
            } else {
                return .large
            }
            #endif
        }
    }
}

/// An adaptive representation of `ContainerBackgroundPlacement` that falls back safely.
public enum AdaptiveContainerBackgroundPlacement: Sendable {
    case navigation
    case navigationSplitView
    
    @available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 1.0, visionOS 1.0, *)
    public var native: ContainerBackgroundPlacement {
        switch self {
        case .navigation:
            return .navigation
        case .navigationSplitView:
            #if os(macOS) || os(tvOS) || os(visionOS)
            return .navigation
            #else
            if #available(iOS 18.0, watchOS 11.0, *) {
                return .navigationSplitView
            } else {
                return .navigation
            }
            #endif
        }
    }
}

public extension View {
    
    // MARK: - ControlSize
    
    /// Applies a control size to the view.
    /// - Uses `.controlSize(_:)` on iOS 15.0+, macOS 10.15+, watchOS 9.0+, tvOS 15.0+, visionOS 1.0+
    /// - Falls back to doing nothing on older versions.
    @ViewBuilder
    func adaptiveControlSize(_ size: AdaptiveControlSize) -> some View {
        if #available(iOS 15.0, macOS 10.15, tvOS 15.0, watchOS 9.0, visionOS 1.0, *) {
            self.controlSize(size.native)
        } else {
            self
        }
    }
    
    // MARK: - Container Background
    
    /// Sets the container background of the enclosing container.
    /// Supports `.navigation` (iOS 17+) and `.navigationSplitView` (iOS 18+).
    /// - Falls back to doing nothing on versions below iOS 17.
    @ViewBuilder
    func adaptiveContainerBackground<S: ShapeStyle>(_ style: S, for placement: AdaptiveContainerBackgroundPlacement) -> some View {
        if #available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 1.0, visionOS 1.0, *) {
            self.containerBackground(style, for: placement.native)
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
    func adaptiveBackgroundExtensionEffect() -> some View {
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
    func adaptiveGlassEffect() -> some View {
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
    func adaptiveGlassEffect<S: Shape>(in shape: S) -> some View {
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
}
