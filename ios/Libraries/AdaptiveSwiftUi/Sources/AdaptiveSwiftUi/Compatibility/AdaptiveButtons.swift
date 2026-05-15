import SwiftUI

extension View {
    
    /// Sets the sizing behavior for adaptive buttons.
    ///
    /// On iOS 26+, it uses the native `buttonSizing` modifier.
    /// On older versions, `.flexible` is polyfilled using `maxWidth: .infinity`.
    ///
    /// Example:
    /// ```swift
    /// AdaptiveButton("Submit") {}
    ///     .adaptiveButtonSizing(.flexible)
    /// ```
    @ViewBuilder
    public func adaptiveButtonSizing(_ sizing: AdaptiveButtonSizing) -> some View {
        if #available(iOS 26.0, macOS 26.0, tvOS 26.0, watchOS 26.0, visionOS 26.0, *) {
            switch sizing {
            case .automatic:
                self.buttonSizing(.automatic)
            case .fitted:
                self.buttonSizing(.fitted)
            case .flexible:
                self.buttonSizing(.flexible)
            }
        } else {
            switch sizing {
            case .flexible:
                self.frame(maxWidth: .infinity)
            case .automatic, .fitted:
                self
            }
        }
    }

    /// Sets the visual style for adaptive buttons.
    ///
    /// Supports native styles and polyfills the modern iOS 26+ "Glass" styles to "Bordered" styles on older systems.
    ///
    /// Example:
    /// ```swift
    /// AdaptiveButton("Action") {}
    ///     .adaptiveButtonStyle(.glassProminent)
    /// ```
    @ViewBuilder
    public func adaptiveButtonStyle(_ style: AdaptiveButtonStyle) -> some View {
        switch style {
        case .automatic:
            self.buttonStyle(.automatic)
        case .plain:
            self.buttonStyle(.plain)
        case .borderless:
            self.buttonStyle(.borderless)
        case .bordered:
            self.buttonStyle(.bordered)
        case .borderedProminent:
            self.buttonStyle(.borderedProminent)
        case .glass:
            if #available(iOS 26.0, macOS 26.0, tvOS 26.0, watchOS 26.0, visionOS 26.0, *) {
                self.buttonStyle(.glass)
            } else {
                self.buttonStyle(.bordered)
            }
        case .glassProminent:
            if #available(iOS 26.0, macOS 26.0, tvOS 26.0, watchOS 26.0, visionOS 26.0, *) {
                self.buttonStyle(.glassProminent)
            } else {
                self.buttonStyle(.borderedProminent)
            }
        }
    }

    /// Sets the tint color for adaptive buttons.
    ///
    /// Uses native `tint(_:)` on iOS 15+ and gracefully degrades on older versions.
    ///
    /// Example:
    /// ```swift
    /// AdaptiveButton("Delete") {}
    ///     .adaptiveButtonTint(.red)
    /// ```
    @ViewBuilder
    public func adaptiveButtonTint(_ tint: Color?) -> some View {
        if let tint {
            if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, visionOS 1.0, *) {
                self.tint(tint)
            } else {
                self
            }
        } else {
            self
        }
    }

    /// Sets the border shape for adaptive buttons.
    ///
    /// Supports various shapes including Capsule and Circle, with automatic fallback for older OS versions.
    ///
    /// Example:
    /// ```swift
    /// AdaptiveButton("Login") {}
    ///     .adaptiveButtonBorderShape(.capsule)
    /// ```
    @ViewBuilder
    public func adaptiveButtonBorderShape(_ shape: AdaptiveButtonBorderShape) -> some View {
        #if os(iOS) || os(macOS) || os(tvOS) || os(watchOS) || os(visionOS)
            switch shape {
            case .automatic:
                self
            case .roundedRectangle:
                if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, visionOS 1.0, *) {
                    self.buttonBorderShape(.roundedRectangle)
                } else {
                    self
                }
            case .capsule:
                if #available(iOS 15.0, macOS 14.0, tvOS 17.0, watchOS 8.0, visionOS 1.0, *) {
                    self.buttonBorderShape(.capsule)
                } else {
                    self
                }
            case .circle:
                if #available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, visionOS 1.0, *) {
                    self.buttonBorderShape(.circle)
                } else {
                    self.clipShape(Circle())
                }
            case .roundedRectangleRadius(let radius):
                if #available(iOS 15.0, macOS 14.0, tvOS 17.0, watchOS 8.0, visionOS 1.0, *) {
                    self.buttonBorderShape(.roundedRectangle(radius: radius))
                } else {
                    self
                }
            }
        #else
            self
        #endif
    }
}
