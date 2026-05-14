import SwiftUI

public enum AdaptiveTabBarMinimizeBehavior: Sendable {
    case automatic
    case never
    case onScrollDown
    case onScrollUp
}

public enum AdaptiveAdaptableTabBarPlacement: Sendable {
    case automatic
    case sidebar
    case tabBar
}

public enum AdaptiveBottomAccessoryPlacement: Sendable {
    case inline
    case expanded
    case none
}

@available(iOS 26.0, macOS 26.0, watchOS 26.0, visionOS 26.0, *)
@available(tvOS, unavailable)
public struct AdaptiveTabViewBottomAccessoryPlacementReader<Content: View>: View {
    private let content: (AdaptiveBottomAccessoryPlacement) -> Content

    @Environment(\.tabViewBottomAccessoryPlacement) private var placement

    public init(@ViewBuilder content: @escaping (AdaptiveBottomAccessoryPlacement) -> Content) {
        self.content = content
    }

    @ViewBuilder
    public var body: some View {
        #if os(iOS)
        if #available(iOS 26.0, *) {
            content(normalizedPlacement)
        } else {
            content(.none)
        }
        #else
        content(.none)
        #endif
    }

    private var normalizedPlacement: AdaptiveBottomAccessoryPlacement {
        #if os(iOS)
        if #available(iOS 26.0, *) {
            switch placement {
            case .inline: return .inline
            case .expanded: return .expanded
            default: return .none
            }
        } else {
            return .none
        }
        #else
        return .none
        #endif
    }
}

public extension View {
    @ViewBuilder
    func adaptiveTabBarMinimizeBehavior(
        _ behavior: AdaptiveTabBarMinimizeBehavior = .onScrollDown
    ) -> some View {
        #if os(iOS)
        if #available(iOS 26.0, *) {
            switch behavior {
            case .automatic:
                self.tabBarMinimizeBehavior(.automatic)
            case .never:
                self.tabBarMinimizeBehavior(.never)
            case .onScrollDown:
                self.tabBarMinimizeBehavior(.onScrollDown)
            case .onScrollUp:
                self.tabBarMinimizeBehavior(.onScrollUp)
            }
        } else {
            self
        }
        #elseif os(tvOS)
        if #available(tvOS 26.0, *) {
            switch behavior {
            case .automatic:
                self.tabBarMinimizeBehavior(.automatic)
            default:
                self
            }
        } else {
            self
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    func adaptiveTabViewBottomAccessory<Content: View>(
        isEnabled: Bool = true,
        @ViewBuilder content: @escaping () -> Content
    ) -> some View {
        #if os(iOS)
        if #available(iOS 26.1, *) {
            self.tabViewBottomAccessory(isEnabled: isEnabled) {
                content()
            }
        } else {
            self
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    func adaptiveTabViewSidebarHeader<Content: View>(
        @ViewBuilder _ content: @escaping () -> Content
    ) -> some View {
        #if os(iOS) || os(macOS) || os(visionOS)
        if #available(iOS 18.0, macOS 15.0, visionOS 2.0, *) {
            self.tabViewSidebarHeader {
                content()
            }
        } else {
            self
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    func adaptiveTabViewSidebarFooter<Content: View>(
        @ViewBuilder _ content: @escaping () -> Content
    ) -> some View {
        #if os(iOS) || os(macOS) || os(visionOS)
        if #available(iOS 18.0, macOS 15.0, visionOS 2.0, *) {
            self.tabViewSidebarFooter {
                content()
            }
        } else {
            self
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    func adaptiveTabViewSidebarBottomBar<Content: View>(
        @ViewBuilder _ content: @escaping () -> Content
    ) -> some View {
        #if os(iOS) || os(macOS) || os(visionOS)
        if #available(iOS 18.0, macOS 15.0, visionOS 2.0, *) {
            self.tabViewSidebarBottomBar {
                content()
            }
        } else {
            self
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    func adaptiveDefaultAdaptableTabBarPlacement(
        _ placement: AdaptiveAdaptableTabBarPlacement = .automatic
    ) -> some View {
        #if os(iOS)
        if #available(iOS 18.0, *) {
            switch placement {
            case .automatic:
                self.defaultAdaptableTabBarPlacement(.automatic)
            case .sidebar:
                self.defaultAdaptableTabBarPlacement(.sidebar)
            case .tabBar:
                self.defaultAdaptableTabBarPlacement(.tabBar)
            }
        } else {
            self
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    func adaptiveTabViewCustomization(_ customizationData: Binding<Data>) -> some View {
        #if os(iOS) || os(macOS) || os(visionOS)
        if #available(iOS 18.0, macOS 15.0, visionOS 2.0, *) {
            let proxy = Binding<TabViewCustomization>(
                get: {
                    (try? JSONDecoder().decode(TabViewCustomization.self, from: customizationData.wrappedValue))
                    ?? TabViewCustomization()
                },
                set: { newValue in
                    customizationData.wrappedValue = (try? JSONEncoder().encode(newValue)) ?? Data()
                }
            )
            self.tabViewCustomization(proxy)
        } else {
            self
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    func adaptiveTabViewCustomization(_ customizationData: Binding<Data?>) -> some View {
        #if os(iOS) || os(macOS) || os(visionOS)
        if #available(iOS 18.0, macOS 15.0, visionOS 2.0, *) {
            let proxy = Binding<TabViewCustomization>(
                get: {
                    guard let data = customizationData.wrappedValue else {
                        return TabViewCustomization()
                    }
                    return (try? JSONDecoder().decode(TabViewCustomization.self, from: data))
                    ?? TabViewCustomization()
                },
                set: { newValue in
                    customizationData.wrappedValue = try? JSONEncoder().encode(newValue)
                }
            )
            self.tabViewCustomization(proxy)
        } else {
            self
        }
        #else
        self
        #endif
    }
}

@available(iOS 18.0, macOS 15.0, visionOS 2.0, *)
@available(tvOS, unavailable)
@available(watchOS, unavailable)
public extension View {
    func adaptiveTabViewCustomization(_ customization: Binding<TabViewCustomization>) -> some View {
        tabViewCustomization(customization)
    }

    func adaptiveTabViewCustomization(_ customization: Binding<TabViewCustomization>?) -> some View {
        tabViewCustomization(customization)
    }
}
