import SwiftUI

public enum AdaptivePageTabIndexDisplayMode: Sendable {
    case automatic
    case always
    case never
}

public enum AdaptiveTabViewStyle: Sendable {
    case automatic
    case sidebarAdaptable
    case tabBarOnly
    case grouped
    case page(indexDisplayMode: AdaptivePageTabIndexDisplayMode = .automatic)
    case verticalPage
}

public extension View {
    @ViewBuilder
    func adaptiveTabViewStyle(_ style: AdaptiveTabViewStyle) -> some View {
        switch style {
        case .automatic:
            self.tabViewStyle(.automatic)
        case .sidebarAdaptable:
            #if os(iOS) || os(macOS) || os(tvOS) || os(visionOS)
            if #available(iOS 18.0, macOS 15.0, tvOS 18.0, visionOS 2.0, *) {
                self.tabViewStyle(.sidebarAdaptable)
            } else {
                self.tabViewStyle(.automatic)
            }
            #else
            self.tabViewStyle(.automatic)
            #endif
        case .tabBarOnly:
            #if os(iOS) || os(macOS) || os(tvOS) || os(visionOS)
            if #available(iOS 18.0, macOS 15.0, tvOS 18.0, visionOS 2.0, *) {
                self.tabViewStyle(.tabBarOnly)
            } else {
                self.tabViewStyle(.automatic)
            }
            #else
            self.tabViewStyle(.automatic)
            #endif
        case .grouped:
            #if os(macOS)
            if #available(macOS 15.0, *) {
                self.tabViewStyle(.grouped)
            } else {
                self.tabViewStyle(.automatic)
            }
            #else
            self.tabViewStyle(.automatic)
            #endif
        case let .page(indexDisplayMode):
            #if os(iOS) || os(tvOS) || os(watchOS) || os(visionOS)
            if #available(iOS 14.0, tvOS 14.0, watchOS 7.0, visionOS 1.0, *) {
                switch indexDisplayMode {
                case .automatic:
                    self.tabViewStyle(.page(indexDisplayMode: .automatic))
                case .always:
                    self.tabViewStyle(.page(indexDisplayMode: .always))
                case .never:
                    self.tabViewStyle(.page(indexDisplayMode: .never))
                }
            } else {
                self.tabViewStyle(.automatic)
            }
            #else
            self.tabViewStyle(.automatic)
            #endif
        case .verticalPage:
            #if os(watchOS)
            if #available(watchOS 10.0, *) {
                self.tabViewStyle(.verticalPage)
            } else {
                self.tabViewStyle(.automatic)
            }
            #else
            self.tabViewStyle(.automatic)
            #endif
        }
    }
}
