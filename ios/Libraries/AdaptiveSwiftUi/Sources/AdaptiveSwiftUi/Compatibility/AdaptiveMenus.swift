import SwiftUI

extension View {
    
    /// Sets the order of items within an adaptive menu.
    ///
    /// This modifier handles cross-platform mapping for menu item ordering:
    /// - **iOS 16+ / watchOS 9+**: Maps to native `.menuOrder()`.
    /// - **macOS**: Maps `.priority` to `.automatic` as priority ordering is not natively supported.
    /// - **Legacy Fallback**: Gracefully ignores the modifier on older systems.
    ///
    /// - Parameter order: The preferred ordering behavior (e.g., `.fixed`, `.priority`).
    ///
    /// Example:
    /// ```swift
    /// Menu("Options") {
    ///     Button("Delete", role: .destructive) { }
    ///     Button("Edit") { }
    /// }
    /// .adaptiveMenuOrder(.priority)
    /// ```
    @ViewBuilder
    public func adaptiveMenuOrder(_ order: AdaptiveMenuOrder) -> some View {
        #if os(iOS) || os(macOS) || os(watchOS) || os(tvOS) || os(visionOS)
            if #available(iOS 16.0, macOS 13.0, watchOS 9.0, tvOS 16.0, visionOS 1.0, *) {
                switch order {
                case .automatic:
                    self.menuOrder(.automatic)
                case .fixed:
                    self.menuOrder(.fixed)
                case .priority:
                    #if os(macOS)
                        self.menuOrder(.automatic)
                    #else
                        self.menuOrder(.priority)
                    #endif
                }
            } else {
                self
            }
        #else
            self
        #endif
    }

    /// Adds an adaptive context menu with optional preview support.
    ///
    /// This modifier provides a unified way to add context menus:
    /// - **iOS 16+**: Uses the native `.contextMenu(menuItems:preview:)` which includes a preview view.
    /// - **Legacy**: Falls back to the standard `.contextMenu(menuItems:)` without preview.
    ///
    /// Example:
    /// ```swift
    /// Image("Photo")
    ///     .adaptiveContextMenu(
    ///         menuItems: { Button("Share") { } },
    ///         preview: { Text("Image Preview") }
    ///     )
    /// ```
    @ViewBuilder
    public func adaptiveContextMenu<MenuItems: View, Preview: View>(
        @ViewBuilder menuItems: @escaping () -> MenuItems,
        @ViewBuilder preview: @escaping () -> Preview
    ) -> some View {
        #if os(iOS) || os(macOS) || os(tvOS) || os(visionOS)
            if #available(iOS 16.0, macOS 13.0, tvOS 16.0, visionOS 1.0, *) {
                self.contextMenu(menuItems: menuItems, preview: preview)
            } else {
                self.contextMenu(menuItems: menuItems)
            }
        #else
            self
        #endif
    }
}
