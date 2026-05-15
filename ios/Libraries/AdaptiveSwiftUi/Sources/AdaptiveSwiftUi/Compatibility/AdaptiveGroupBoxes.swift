import SwiftUI

public extension View {
    /// Applies a custom background style to a GroupBox.
    /// Natively supported on iOS 16.0+, macOS 13.0+, watchOS 9.0+, tvOS 16.0+, visionOS 1.0+.
    /// Degrades gracefully (does nothing) on older OS versions where a custom GroupBoxStyle would be required.
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
