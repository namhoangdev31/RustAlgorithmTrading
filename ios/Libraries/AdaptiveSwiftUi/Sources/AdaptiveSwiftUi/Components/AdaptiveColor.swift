import SwiftUI

/// A namespace for adaptive colors, bridging system colors to SwiftUI across all Apple platforms.
///
/// `AdaptiveColor` provides a unified API to access system-defined colors (like separators, 
/// backgrounds, and labels) that automatically adapt to light and dark modes. It also 
/// includes polyfills for modern colors like `mint` and `indigo` on older OS versions (iOS 13/14).
///
/// Example:
/// ```swift
/// Text("Adaptive Text")
///     .padding()
///     .background(AdaptiveColor.systemBackground)
///     .foregroundColor(AdaptiveColor.label)
/// ```
public struct AdaptiveColor {
    
    // MARK: - UIKit/AppKit Bridge Colors
    
    /// The standard color for thin borders or divider lines.
    public static var separator: Color {
        #if canImport(UIKit)
        return Color(UIColor.separator)
        #elseif canImport(AppKit)
        return Color(NSColor.separatorColor)
        #else
        return Color.gray.opacity(0.3)
        #endif
    }
    
    /// The standard color for thicker, opaque borders or divider lines.
    public static var opaqueSeparator: Color {
        #if canImport(UIKit)
        return Color(UIColor.opaqueSeparator)
        #elseif canImport(AppKit)
        return Color(NSColor.separatorColor)
        #else
        return Color.gray
        #endif
    }
    
    /// The standard system background color.
    public static var systemBackground: Color {
        #if canImport(UIKit)
        return Color(UIColor.systemBackground)
        #elseif canImport(AppKit)
        return Color(NSColor.windowBackgroundColor)
        #else
        return Color.white
        #endif
    }
    
    /// A secondary system background color, typically used for grouping elements.
    public static var secondarySystemBackground: Color {
        #if canImport(UIKit)
        return Color(UIColor.secondarySystemBackground)
        #elseif canImport(AppKit)
        return Color(NSColor.controlBackgroundColor)
        #else
        return Color.gray.opacity(0.1)
        #endif
    }
    
    /// A tertiary system background color.
    public static var tertiarySystemBackground: Color {
        #if canImport(UIKit)
        return Color(UIColor.tertiarySystemBackground)
        #elseif canImport(AppKit)
        return Color(NSColor.windowBackgroundColor) // Fallback
        #else
        return Color.gray.opacity(0.05)
        #endif
    }
    
    /// The system background color for grouped content.
    public static var systemGroupedBackground: Color {
        #if canImport(UIKit)
        return Color(UIColor.systemGroupedBackground)
        #elseif canImport(AppKit)
        return Color(NSColor.windowBackgroundColor)
        #else
        return Color.gray.opacity(0.1)
        #endif
    }
    
    /// A secondary system background color for grouped content.
    public static var secondarySystemGroupedBackground: Color {
        #if canImport(UIKit)
        return Color(UIColor.secondarySystemGroupedBackground)
        #elseif canImport(AppKit)
        return Color(NSColor.controlBackgroundColor)
        #else
        return Color.white
        #endif
    }
    
    /// A tertiary system background color for grouped content.
    public static var tertiarySystemGroupedBackground: Color {
        #if canImport(UIKit)
        return Color(UIColor.tertiarySystemGroupedBackground)
        #elseif canImport(AppKit)
        return Color(NSColor.windowBackgroundColor)
        #else
        return Color.gray.opacity(0.05)
        #endif
    }
    
    /// The standard color for placeholder text.
    public static var placeholderText: Color {
        #if canImport(UIKit)
        return Color(UIColor.placeholderText)
        #elseif canImport(AppKit)
        return Color(NSColor.placeholderTextColor)
        #else
        return Color.gray.opacity(0.5)
        #endif
    }
    
    /// A system-defined fill color.
    public static var systemFill: Color {
        #if canImport(UIKit)
        return Color(UIColor.systemFill)
        #elseif canImport(AppKit)
        return Color.gray.opacity(0.2)
        #else
        return Color.gray.opacity(0.2)
        #endif
    }
    
    /// A secondary system-defined fill color.
    public static var secondarySystemFill: Color {
        #if canImport(UIKit)
        return Color(UIColor.secondarySystemFill)
        #elseif canImport(AppKit)
        return Color.gray.opacity(0.16)
        #else
        return Color.gray.opacity(0.16)
        #endif
    }
    
    /// A tertiary system-defined fill color.
    public static var tertiarySystemFill: Color {
        #if canImport(UIKit)
        return Color(UIColor.tertiarySystemFill)
        #elseif canImport(AppKit)
        return Color.gray.opacity(0.12)
        #else
        return Color.gray.opacity(0.12)
        #endif
    }
    
    /// A quaternary system-defined fill color.
    public static var quaternarySystemFill: Color {
        #if canImport(UIKit)
        return Color(UIColor.quaternarySystemFill)
        #elseif canImport(AppKit)
        return Color.gray.opacity(0.08)
        #else
        return Color.gray.opacity(0.08)
        #endif
    }
    
    /// The standard color for primary labels.
    public static var label: Color {
        #if canImport(UIKit)
        return Color(UIColor.label)
        #elseif canImport(AppKit)
        return Color(NSColor.labelColor)
        #else
        return .primary
        #endif
    }
    
    /// The standard color for secondary labels.
    public static var secondaryLabel: Color {
        #if canImport(UIKit)
        return Color(UIColor.secondaryLabel)
        #elseif canImport(AppKit)
        return Color(NSColor.secondaryLabelColor)
        #else
        return .secondary
        #endif
    }

    /// The standard color for tertiary labels.
    public static var tertiaryLabel: Color {
        #if canImport(UIKit)
        return Color(UIColor.tertiaryLabel)
        #elseif canImport(AppKit)
        return Color(NSColor.tertiaryLabelColor)
        #else
        return Color.gray.opacity(0.5)
        #endif
    }
    
    /// The standard color for quaternary labels.
    public static var quaternaryLabel: Color {
        #if canImport(UIKit)
        return Color(UIColor.quaternaryLabel)
        #elseif canImport(AppKit)
        return Color(NSColor.quaternaryLabelColor)
        #else
        return Color.gray.opacity(0.2)
        #endif
    }
    
    // MARK: - Modern Standard Colors Polyfill
    
    /// An adaptive mint color. Falls back to a simulated mint on iOS 13/14.
    public static var mint: Color {
        if #available(iOS 15.0, macOS 12.0, watchOS 8.0, tvOS 15.0, *) {
            return .mint
        } else {
            return Color(red: 0/255, green: 199/255, blue: 190/255)
        }
    }
    
    /// An adaptive teal color. Falls back to a simulated teal on iOS 13/14.
    public static var teal: Color {
        if #available(iOS 15.0, macOS 12.0, watchOS 8.0, tvOS 15.0, *) {
            return .teal
        } else {
            return Color(red: 48/255, green: 176/255, blue: 199/255)
        }
    }
    
    /// An adaptive cyan color. Falls back to a simulated cyan on iOS 13/14.
    public static var cyan: Color {
        if #available(iOS 15.0, macOS 12.0, watchOS 8.0, tvOS 15.0, *) {
            return .cyan
        } else {
            return Color(red: 50/255, green: 173/255, blue: 230/255)
        }
    }
    
    /// An adaptive indigo color. Falls back to a simulated indigo on iOS 13/14.
    public static var indigo: Color {
        if #available(iOS 15.0, macOS 12.0, watchOS 8.0, tvOS 15.0, *) {
            return .indigo
        } else {
            return Color(red: 88/255, green: 86/255, blue: 214/255)
        }
    }
    
    /// An adaptive brown color. Falls back to a simulated brown on iOS 13/14.
    public static var brown: Color {
        if #available(iOS 15.0, macOS 12.0, watchOS 8.0, tvOS 15.0, *) {
            return .brown
        } else {
            return Color(red: 162/255, green: 132/255, blue: 94/255)
        }
    }
}
