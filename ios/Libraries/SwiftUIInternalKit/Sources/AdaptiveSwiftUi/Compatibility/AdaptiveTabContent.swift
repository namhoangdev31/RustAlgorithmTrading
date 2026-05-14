import SwiftUI

@available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *)
public enum AdaptiveTabCustomizationPlacement: Hashable, Sendable {
    case automatic
    case tabBar
    case sidebar
}

@available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *)
public enum AdaptiveTabCustomizationBehavior: Sendable {
    case automatic
    case reorderable
    case disabled
}

@available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *)
public enum AdaptiveTabRole: Sendable {
    case automatic
    case search
}

@available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *)
public func AdaptiveValueTab<Value: Hashable, Content: View>(
    _ titleKey: LocalizedStringKey,
    systemImage: String,
    value: Value,
    role: AdaptiveTabRole = .automatic,
    @ViewBuilder content: @escaping () -> Content
) -> some TabContent<Value> {
    switch role {
    case .automatic:
        Tab(titleKey, systemImage: systemImage, value: value) {
            content()
        }
    case .search:
        Tab(titleKey, systemImage: systemImage, value: value, role: .search) {
            content()
        }
    }
}

@available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *)
public func AdaptiveTabSection<Content: TabContent>(
    _ title: LocalizedStringKey,
    @TabContentBuilder<Content.TabValue> content: @escaping () -> Content
) -> some TabContent<Content.TabValue> where Content.TabValue: Hashable {
    TabSection(title) {
        content()
    }
}

@available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *)
public func AdaptiveTabSection<Content: TabContent>(
    @TabContentBuilder<Content.TabValue> content: @escaping () -> Content
) -> some TabContent<Content.TabValue> where Content.TabValue: Hashable {
    TabSection {
        content()
    }
}

@available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *)
public extension TabContent {
    func adaptiveCustomizationID(_ id: String) -> some TabContent<TabValue> {
        customizationID(id)
    }

    #if !os(tvOS) && !os(watchOS)
    func adaptiveTabBadge(_ value: Int) -> some TabContent<TabValue> {
        badge(value)
    }

    func adaptiveTabBadge(_ value: String) -> some TabContent<TabValue> {
        badge(value)
    }
    #endif

    #if !os(watchOS)
    func adaptiveSectionActions<Actions: View>(
        @ViewBuilder _ content: @escaping () -> Actions
    ) -> some TabContent<TabValue> {
        sectionActions {
            content()
        }
    }
    #endif
}

#if os(iOS) || os(visionOS)
@available(iOS 18.0, visionOS 2.0, *)
public extension TabContent {
    func adaptiveCustomizationBehavior(
        _ behavior: AdaptiveTabCustomizationBehavior = .automatic,
        for placements: Set<AdaptiveTabCustomizationPlacement> = [.sidebar, .tabBar]
    ) -> some TabContent<TabValue> {
        let mappedBehavior: TabCustomizationBehavior
        switch behavior {
        case .automatic:
            mappedBehavior = .automatic
        case .reorderable:
            mappedBehavior = .reorderable
        case .disabled:
            mappedBehavior = .disabled
        }
        if placements.contains(.sidebar) && placements.contains(.tabBar) {
            return customizationBehavior(mappedBehavior, for: .sidebar, .tabBar)
        } else if placements.contains(.sidebar) {
            return customizationBehavior(mappedBehavior, for: .sidebar)
        } else if placements.contains(.tabBar) {
            return customizationBehavior(mappedBehavior, for: .tabBar)
        } else {
            return customizationBehavior(mappedBehavior, for: .automatic)
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
        let mappedBehavior: TabCustomizationBehavior = .automatic
        let _ = behavior
        if placements.contains(.tabBar) {
            return customizationBehavior(mappedBehavior, for: .tabBar)
        }
        return customizationBehavior(mappedBehavior, for: .tabBar)
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
