import SwiftUI

// ╔══════════════════════════════════════════════════════════════════╗
// ║  AdaptiveTabViews — Compatibility Layer                         ║
// ║  Covers all 21 Tab Views items from exploreswiftui_feed.json    ║
// ║  File: Compatibility/AdaptiveTabViews.swift                     ║
// ╚══════════════════════════════════════════════════════════════════╝

// MARK: - Enums: TabView Style (Items #9, #11, #12, #13, #14, #16)

/// Adaptive enum mirroring every `TabViewStyle` variant across OS versions.
public enum AdaptiveTabViewStyle: Sendable {
    /// System default.
    case automatic
    /// Sidebar on iPad/macOS, tab bar on iPhone. iOS 18+.
    case sidebarAdaptable
    /// Always tab bar, never sidebar. iOS 18+.
    case tabBarOnly
    /// Grouped tab bar. macOS 15+ only.
    case grouped
    /// Horizontal paged scrolling. iOS 14+.
    case page(indexDisplayMode: AdaptivePageTabIndexDisplayMode = .automatic)
    /// Vertical paged scrolling. watchOS 10+ only.
    case verticalPage
}

public enum AdaptivePageTabIndexDisplayMode: Sendable {
    case automatic, always, never
}

// MARK: - Enums: Tab Bar Minimize (Item #100)

public enum AdaptiveTabBarMinimizeBehavior: Sendable {
    case automatic, never, onScrollDown, onScrollUp
}

// MARK: - Enums: Adaptable Placement (Item #6)

public enum AdaptiveAdaptableTabBarPlacement: Sendable {
    case automatic, sidebar, tabBar
}

// MARK: - Enums: Bottom Accessory Placement (Item #98)

public enum AdaptiveBottomAccessoryPlacement: Sendable {
    case inline, expanded, none
}

// MARK: - Enums: Customization (Items #2, #1)

@available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *)
public enum AdaptiveTabCustomizationPlacement: Hashable, Sendable {
    case automatic, tabBar, sidebar
}

@available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *)
public enum AdaptiveTabCustomizationBehavior: Sendable {
    case automatic, reorderable, disabled
}

// MARK: - Enums: Tab Role (Item #18)

@available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *)
public enum AdaptiveTabRole: Sendable {
    case automatic, search
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MARK: - View Modifiers: TabView Style
// Items #9, #11, #12, #13, #14, #16
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
            } else { self.tabViewStyle(.automatic) }
            #else
            self.tabViewStyle(.automatic)
            #endif

        case .tabBarOnly:
            #if os(iOS) || os(macOS) || os(tvOS) || os(visionOS)
            if #available(iOS 18.0, macOS 15.0, tvOS 18.0, visionOS 2.0, *) {
                self.tabViewStyle(.tabBarOnly)
            } else { self.tabViewStyle(.automatic) }
            #else
            self.tabViewStyle(.automatic)
            #endif

        case .grouped:
            #if os(macOS)
            if #available(macOS 15.0, *) {
                self.tabViewStyle(.grouped)
            } else { self.tabViewStyle(.automatic) }
            #else
            self.tabViewStyle(.automatic)
            #endif

        case let .page(indexDisplayMode):
            #if os(iOS) || os(tvOS) || os(watchOS) || os(visionOS)
            if #available(iOS 14.0, tvOS 14.0, watchOS 7.0, visionOS 1.0, *) {
                switch indexDisplayMode {
                case .automatic: self.tabViewStyle(.page(indexDisplayMode: .automatic))
                case .always:    self.tabViewStyle(.page(indexDisplayMode: .always))
                case .never:     self.tabViewStyle(.page(indexDisplayMode: .never))
                }
            } else { self.tabViewStyle(.automatic) }
            #else
            self.tabViewStyle(.automatic)
            #endif

        case .verticalPage:
            #if os(watchOS)
            if #available(watchOS 10.0, *) {
                self.tabViewStyle(.verticalPage)
            } else { self.tabViewStyle(.automatic) }
            #else
            self.tabViewStyle(.automatic)
            #endif
        }
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MARK: - View Modifiers: Sidebar (iOS 18+)
// Items #4, #5, #6, #8
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

public extension View {
    /// Item #8: Tab View Side Bar Header — iOS 18+, macOS 15+, visionOS 2+.
    @ViewBuilder
    func adaptiveTabViewSidebarHeader<Content: View>(
        @ViewBuilder _ content: @escaping () -> Content
    ) -> some View {
        #if os(iOS) || os(macOS) || os(visionOS)
        if #available(iOS 18.0, macOS 15.0, visionOS 2.0, *) {
            self.tabViewSidebarHeader { content() }
        } else { self }
        #else
        self
        #endif
    }

    /// Item #4: Tab View Side Bar Footer — iOS 18+, macOS 15+, visionOS 2+.
    @ViewBuilder
    func adaptiveTabViewSidebarFooter<Content: View>(
        @ViewBuilder _ content: @escaping () -> Content
    ) -> some View {
        #if os(iOS) || os(macOS) || os(visionOS)
        if #available(iOS 18.0, macOS 15.0, visionOS 2.0, *) {
            self.tabViewSidebarFooter { content() }
        } else { self }
        #else
        self
        #endif
    }

    /// Item #5: Tab View Side Bar Bottom Bar — iOS 18+, visionOS 2+.
    @ViewBuilder
    func adaptiveTabViewSidebarBottomBar<Content: View>(
        @ViewBuilder _ content: @escaping () -> Content
    ) -> some View {
        #if os(iOS) || os(visionOS)
        if #available(iOS 18.0, visionOS 2.0, *) {
            self.tabViewSidebarBottomBar { content() }
        } else { self }
        #else
        self
        #endif
    }

    /// Item #6: Default Adaptable Tab Bar Placement — iOS 18+, iPadOS 18+.
    @ViewBuilder
    func adaptiveDefaultAdaptableTabBarPlacement(
        _ placement: AdaptiveAdaptableTabBarPlacement = .automatic
    ) -> some View {
        #if os(iOS)
        if #available(iOS 18.0, *) {
            switch placement {
            case .automatic: self.defaultAdaptableTabBarPlacement(.automatic)
            case .sidebar:   self.defaultAdaptableTabBarPlacement(.sidebar)
            case .tabBar:    self.defaultAdaptableTabBarPlacement(.tabBar)
            }
        } else { self }
        #else
        self
        #endif
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MARK: - View Modifiers: Customization Binding (Items #2, #3)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

public extension View {
    /// Item #3: Bind customization storage via Data.
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
        } else { self }
        #else
        self
        #endif
    }

    /// Item #3: Bind customization storage via optional Data.
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
        } else { self }
        #else
        self
        #endif
    }
}

/// Native TabViewCustomization binding passthrough (iOS 18+).
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MARK: - View Modifiers: iOS 26+ Liquid Glass
// Items #99, #100
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

public extension View {
    /// Item #100: Hide tab bar on scroll down — iOS 26+, iPadOS 26+.
    @ViewBuilder
    func adaptiveTabBarMinimizeBehavior(
        _ behavior: AdaptiveTabBarMinimizeBehavior = .onScrollDown
    ) -> some View {
        #if os(iOS)
        if #available(iOS 26.0, *) {
            switch behavior {
            case .automatic:    self.tabBarMinimizeBehavior(.automatic)
            case .never:        self.tabBarMinimizeBehavior(.never)
            case .onScrollDown: self.tabBarMinimizeBehavior(.onScrollDown)
            case .onScrollUp:   self.tabBarMinimizeBehavior(.onScrollUp)
            }
        } else { self }
        #else
        self
        #endif
    }

    /// Item #99: Bottom Accessory — iOS 26+, iPadOS 26+.
    @ViewBuilder
    func adaptiveTabViewBottomAccessory<Content: View>(
        @ViewBuilder content: @escaping () -> Content
    ) -> some View {
        #if os(iOS)
        if #available(iOS 26.0, *) {
            self.tabViewBottomAccessory { content() }
        } else { self }
        #else
        self
        #endif
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MARK: - TabContent Modifiers (iOS 18+)
// Items #1, #2, #7, #10
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *)
public extension TabContent {
    /// Item #2: Assign a customization ID to this tab.
    func adaptiveCustomizationID(_ id: String) -> some TabContent<TabValue> {
        customizationID(id)
    }

    /// Item #7: Add custom actions to a tab section.
    #if !os(watchOS)
    func adaptiveSectionActions<Actions: View>(
        @ViewBuilder _ content: @escaping () -> Actions
    ) -> some TabContent<TabValue> {
        sectionActions { content() }
    }
    #endif

    /// Item #10: Badge on a tab (integer).
    #if !os(tvOS) && !os(watchOS)
    func adaptiveTabBadge(_ value: Int) -> some TabContent<TabValue> {
        badge(value)
    }

    /// Item #10: Badge on a tab (string).
    func adaptiveTabBadge(_ value: String) -> some TabContent<TabValue> {
        badge(value)
    }
    #endif
}

// MARK: - TabContent: Customization Behavior (Item #1)

#if os(iOS) || os(visionOS)
@available(iOS 18.0, visionOS 2.0, *)
public extension TabContent {
    /// Item #1: Configure customization behavior for specific placements.
    func adaptiveCustomizationBehavior(
        _ behavior: AdaptiveTabCustomizationBehavior = .automatic,
        for placements: Set<AdaptiveTabCustomizationPlacement> = [.sidebar, .tabBar]
    ) -> some TabContent<TabValue> {
        let mapped: TabCustomizationBehavior
        switch behavior {
        case .automatic:   mapped = .automatic
        case .reorderable: mapped = .reorderable
        case .disabled:    mapped = .disabled
        }
        if placements.contains(.sidebar) && placements.contains(.tabBar) {
            return customizationBehavior(mapped, for: .sidebar, .tabBar)
        } else if placements.contains(.sidebar) {
            return customizationBehavior(mapped, for: .sidebar)
        } else if placements.contains(.tabBar) {
            return customizationBehavior(mapped, for: .tabBar)
        } else {
            return customizationBehavior(mapped, for: .automatic)
        }
    }
}
#elseif os(macOS)
@available(macOS 15.0, *)
public extension TabContent {
    func adaptiveCustomizationBehavior(
        _ behavior: AdaptiveTabCustomizationBehavior = .automatic,
        for placements: Set<AdaptiveTabCustomizationPlacement> = [.tabBar]
    ) -> some TabContent<TabValue> {
        let mapped: TabCustomizationBehavior
        switch behavior {
        case .automatic:   mapped = .automatic
        case .reorderable: mapped = .reorderable
        case .disabled:    mapped = .disabled
        }
        if placements.contains(.tabBar) {
            return customizationBehavior(mapped, for: .tabBar)
        }
        return customizationBehavior(mapped, for: .tabBar)
    }
}
#else
@available(tvOS 18.0, watchOS 11.0, *)
public extension TabContent {
    func adaptiveCustomizationBehavior(
        _ behavior: AdaptiveTabCustomizationBehavior = .automatic,
        for placements: Set<AdaptiveTabCustomizationPlacement> = [.automatic]
    ) -> some TabContent<TabValue> {
        let _ = behavior
        let _ = placements
        return self
    }
}
#endif
