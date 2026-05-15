import SwiftUI

/// A namespace for adaptive colors, bridging UIKit colors to SwiftUI and providing
/// polyfills for modern standard colors like mint, teal, cyan, indigo, and brown on iOS 13/14.
public struct AdaptiveColor {
    
    // MARK: - UIKit Bridge Colors (Adaptive)
    
    public static var separator: Color {
        #if canImport(UIKit)
        return Color(UIColor.separator)
        #elseif canImport(AppKit)
        return Color(NSColor.separatorColor)
        #else
        return Color.gray.opacity(0.3)
        #endif
    }
    
    public static var opaqueSeparator: Color {
        #if canImport(UIKit)
        return Color(UIColor.opaqueSeparator)
        #elseif canImport(AppKit)
        return Color(NSColor.separatorColor)
        #else
        return Color.gray
        #endif
    }
    
    public static var systemBackground: Color {
        #if canImport(UIKit)
        return Color(UIColor.systemBackground)
        #elseif canImport(AppKit)
        return Color(NSColor.windowBackgroundColor)
        #else
        return Color.white
        #endif
    }
    
    public static var secondarySystemBackground: Color {
        #if canImport(UIKit)
        return Color(UIColor.secondarySystemBackground)
        #elseif canImport(AppKit)
        return Color(NSColor.controlBackgroundColor)
        #else
        return Color.gray.opacity(0.1)
        #endif
    }
    
    public static var tertiarySystemBackground: Color {
        #if canImport(UIKit)
        return Color(UIColor.tertiarySystemBackground)
        #elseif canImport(AppKit)
        return Color(NSColor.windowBackgroundColor) // Fallback
        #else
        return Color.gray.opacity(0.05)
        #endif
    }
    
    public static var systemGroupedBackground: Color {
        #if canImport(UIKit)
        return Color(UIColor.systemGroupedBackground)
        #elseif canImport(AppKit)
        return Color(NSColor.windowBackgroundColor)
        #else
        return Color.gray.opacity(0.1)
        #endif
    }
    
    public static var secondarySystemGroupedBackground: Color {
        #if canImport(UIKit)
        return Color(UIColor.secondarySystemGroupedBackground)
        #elseif canImport(AppKit)
        return Color(NSColor.controlBackgroundColor)
        #else
        return Color.white
        #endif
    }
    
    public static var tertiarySystemGroupedBackground: Color {
        #if canImport(UIKit)
        return Color(UIColor.tertiarySystemGroupedBackground)
        #elseif canImport(AppKit)
        return Color(NSColor.windowBackgroundColor)
        #else
        return Color.gray.opacity(0.05)
        #endif
    }
    
    public static var placeholderText: Color {
        #if canImport(UIKit)
        return Color(UIColor.placeholderText)
        #elseif canImport(AppKit)
        return Color(NSColor.placeholderTextColor)
        #else
        return Color.gray.opacity(0.5)
        #endif
    }
    
    public static var systemFill: Color {
        #if canImport(UIKit)
        return Color(UIColor.systemFill)
        #elseif canImport(AppKit)
        return Color.gray.opacity(0.2)
        #else
        return Color.gray.opacity(0.2)
        #endif
    }
    
    public static var secondarySystemFill: Color {
        #if canImport(UIKit)
        return Color(UIColor.secondarySystemFill)
        #elseif canImport(AppKit)
        return Color.gray.opacity(0.16)
        #else
        return Color.gray.opacity(0.16)
        #endif
    }
    
    public static var tertiarySystemFill: Color {
        #if canImport(UIKit)
        return Color(UIColor.tertiarySystemFill)
        #elseif canImport(AppKit)
        return Color.gray.opacity(0.12)
        #else
        return Color.gray.opacity(0.12)
        #endif
    }
    
    public static var quaternarySystemFill: Color {
        #if canImport(UIKit)
        return Color(UIColor.quaternarySystemFill)
        #elseif canImport(AppKit)
        return Color.gray.opacity(0.08)
        #else
        return Color.gray.opacity(0.08)
        #endif
    }
    
    public static var label: Color {
        #if canImport(UIKit)
        return Color(UIColor.label)
        #elseif canImport(AppKit)
        return Color(NSColor.labelColor)
        #else
        return .primary
        #endif
    }
    
    public static var secondaryLabel: Color {
        #if canImport(UIKit)
        return Color(UIColor.secondaryLabel)
        #elseif canImport(AppKit)
        return Color(NSColor.secondaryLabelColor)
        #else
        return .secondary
        #endif
    }

    public static var tertiaryLabel: Color {
        #if canImport(UIKit)
        return Color(UIColor.tertiaryLabel)
        #elseif canImport(AppKit)
        return Color(NSColor.tertiaryLabelColor)
        #else
        return Color.gray.opacity(0.5)
        #endif
    }
    
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
    
    public static var mint: Color {
        if #available(iOS 15.0, macOS 12.0, watchOS 8.0, tvOS 15.0, *) {
            return .mint
        } else {
            return Color(red: 0/255, green: 199/255, blue: 190/255)
        }
    }
    
    public static var teal: Color {
        if #available(iOS 15.0, macOS 12.0, watchOS 8.0, tvOS 15.0, *) {
            return .teal
        } else {
            return Color(red: 48/255, green: 176/255, blue: 199/255)
        }
    }
    
    public static var cyan: Color {
        if #available(iOS 15.0, macOS 12.0, watchOS 8.0, tvOS 15.0, *) {
            return .cyan
        } else {
            return Color(red: 50/255, green: 173/255, blue: 230/255)
        }
    }
    
    public static var indigo: Color {
        if #available(iOS 15.0, macOS 12.0, watchOS 8.0, tvOS 15.0, *) {
            return .indigo
        } else {
            return Color(red: 88/255, green: 86/255, blue: 214/255)
        }
    }
    
    public static var brown: Color {
        if #available(iOS 15.0, macOS 12.0, watchOS 8.0, tvOS 15.0, *) {
            return .brown
        } else {
            return Color(red: 162/255, green: 132/255, blue: 94/255)
        }
    }
}
