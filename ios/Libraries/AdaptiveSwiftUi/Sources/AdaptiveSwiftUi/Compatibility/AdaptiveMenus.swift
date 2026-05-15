import SwiftUI

public enum AdaptiveMenuOrder: Sendable {
    case automatic
    case fixed
    case priority
}

extension View {
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
                self.menuOrder(.priority)
            }
        } else {
            self
        }
        #else
        self
        #endif
    }

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
