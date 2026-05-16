import SwiftUI

/// A collection of adaptive modifiers for text and typography.
///
/// These extensions provide safe fallbacks for text-specific modifiers like `tracking`, `kerning`,
/// and `lineSpacing` across different OS versions.

extension Text {

    /// Applies adaptive tracking (letter spacing) to the text.
    ///
    /// Tracking is the process of adjusting the spacing throughout an entire word or block of text.
    ///
    /// - Parameter amount: The amount of tracking to apply.
    /// - Returns: A text view with adjusted tracking.
    /// - Note: Available since iOS 14.0. Gracefully returns the original text on older systems.
    public func adaptiveTracking(_ amount: CGFloat) -> Text {
        if #available(iOS 14.0, macOS 11.0, watchOS 7.0, tvOS 14.0, *) {
            return self.tracking(amount)
        } else {
            // Polyfill for older versions using kerning if preferred,
            // or simply return self as a safe fallback.
            return self
        }
    }

    /// Applies adaptive kerning to the text.
    ///
    /// Kerning is the process of adjusting the spacing between characters in a proportional font.
    ///
    /// - Parameter amount: The amount of kerning to apply.
    /// - Returns: A text view with adjusted kerning.
    /// - Note: Available since iOS 14.0. Gracefully returns the original text on older systems.
    public func adaptiveKerning(_ amount: CGFloat) -> Text {
        if #available(iOS 14.0, macOS 11.0, watchOS 7.0, tvOS 14.0, *) {
            return self.kerning(amount)
        } else {
            return self
        }
    }

    /// Applies adaptive italic style to the text.
    public func adaptiveItalic(_ active: Bool = true) -> Text {
        if active {
            return self.italic()
        } else {
            return self
        }
    }

    /// Applies adaptive bold style to the text.
    public func adaptiveBold(_ active: Bool = true) -> Text {
        if active {
            return self.bold()
        } else {
            return self
        }
    }
}

extension View {

    /// Applies adaptive line spacing to a view.
    ///
    /// - Parameter amount: The amount of spacing to apply between lines.
    /// - Returns: A view with adjusted line spacing.
    /// - Note: Available since iOS 13.0.
    @ViewBuilder
    public func adaptiveLineSpacing(_ amount: CGFloat) -> some View {
        if #available(iOS 13.0, macOS 10.15, watchOS 6.0, tvOS 13.0, *) {
            self.lineSpacing(amount)
        } else {
            self
        }
    }

    @ViewBuilder
    public func adaptiveItalic(_ active: Bool = true) -> some View {
        if active {
            if #available(iOS 16.0, macOS 13.0, watchOS 9.0, tvOS 16.0, *) {
                self.italic()
            } else {
                self
            }
        } else {
            self
        }
    }

    @ViewBuilder
    public func adaptiveBold(_ active: Bool = true) -> some View {
        if active {
            if #available(iOS 16.0, macOS 13.0, watchOS 9.0, tvOS 16.0, *) {
                self.bold()
            } else {
                self
            }
        } else {
            self
        }
    }
}
