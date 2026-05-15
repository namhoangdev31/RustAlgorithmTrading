import SwiftUI

public extension View {
    
    /// Applies a custom background style to a GroupBox with cross-platform support.
    ///
    /// This modifier leverages the native `backgroundStyle` on modern platforms to customize
    /// the appearance of a GroupBox container.
    ///
    /// - Platforms Supported: iOS 16.0+, macOS 13.0+, watchOS 9.0+, tvOS 16.0+, visionOS 1.0+.
    /// - Fallback Behavior: On older OS versions (like iOS 14/15), where background customization 
    ///   typically requires a custom `GroupBoxStyle`, this modifier gracefully does nothing to 
    ///   maintain system stability and default aesthetics.
    ///
    /// Example:
    /// ```swift
    /// AdaptiveGroupBox(label: Text("Settings")) {
    ///     Toggle("Notifications", isOn: $isOn)
    /// }
    /// .adaptiveGroupBoxBackgroundStyle(.secondary.opacity(0.1))
    /// ```
    @ViewBuilder
    func adaptiveGroupBoxBackgroundStyle<S: ShapeStyle>(_ style: S) -> some View {
        #if os(iOS) || os(macOS) || os(watchOS) || os(tvOS) || os(visionOS)
        if #available(iOS 16.0, macOS 13.0, watchOS 9.0, tvOS 16.0, visionOS 1.0, *) {
            self.backgroundStyle(style)
        } else {
            // On iOS 14/15, modifying GroupBox background requires a custom GroupBoxStyle.
            // We gracefully fallback to the default appearance to maintain stability.
            self
        }
        #else
        self
        #endif
    }
}
