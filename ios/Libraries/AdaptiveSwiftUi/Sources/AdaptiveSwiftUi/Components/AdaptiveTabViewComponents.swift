import SwiftUI

// ╔══════════════════════════════════════════════════════════════════╗
// ║  AdaptiveTabViewComponents — Components Layer                   ║
// ║  Concrete types for Tab Views group                             ║
// ║  File: Components/AdaptiveTabViewComponents.swift               ║
// ╚══════════════════════════════════════════════════════════════════╝

// MARK: - AdaptiveValueTab (Items #17, #18, #19)

/// A component that represents a single tab item within an adaptive tab view, supporting selection values and roles.
///
/// `AdaptiveValueTab` leverages modern SwiftUI `Tab` features (iOS 18+):
/// - **Selection (Item #19)**: Associates a specific hashable value with the tab for programmatic navigation.
/// - **Search Role (Item #18)**: Optionally marks the tab as a search interface, allowing the system to optimize its display.
///
/// Example:
/// ```swift
/// TabView(selection: $currentTab) {
///     AdaptiveValueTab("Dashboard", systemImage: "chart.bar", value: TabItem.dashboard) {
///         DashboardView()
///     }
///     AdaptiveValueTab("Search", systemImage: "magnifyingglass", value: TabItem.search, role: .search) {
///         SearchView()
///     }
/// }
/// ```
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

// MARK: - AdaptiveTabSection (Item #15)

/// A component that groups related tabs into a section within a tab view.
///
/// `AdaptiveTabSection` helps organize complex tab navigation (iOS 18+), providing 
/// visual grouping and headers in sidebars or expanded tab bars.
///
/// Example:
/// ```swift
/// TabView {
///     AdaptiveTabSection("Account") {
///         AdaptiveValueTab("Profile", systemImage: "person", value: 1) { ProfileView() }
///         AdaptiveValueTab("Settings", systemImage: "gear", value: 2) { SettingsView() }
///     }
/// }
/// ```
@available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *)
public struct AdaptiveTabSection<Value: Hashable, Content: TabContent<Value>>: TabContent {
    private let title: LocalizedStringKey?
    private let content: () -> Content

    /// Creates a tab section with a localized title.
    public init(
        _ title: LocalizedStringKey,
        @TabContentBuilder<Value> content: @escaping () -> Content
    ) {
        self.title = title
        self.content = content
    }

    /// Creates an untitled tab section.
    public init(
        @TabContentBuilder<Value> content: @escaping () -> Content
    ) {
        self.title = nil
        self.content = content
    }

    public var body: some TabContent<Value> {
        if let title = title {
            TabSection(title) { content() }
        } else {
            TabSection { content() }
        }
    }
}

// MARK: - AdaptiveTabViewBottomAccessoryPlacementReader (Item #98)

/// A container view that reads and exposes the placement of bottom accessories in a tab view.
///
/// This component (iOS 26+) allows you to adjust your UI based on whether a bottom accessory 
/// is displayed inline or in an expanded state.
///
/// Example:
/// ```swift
/// AdaptiveTabViewBottomAccessoryPlacementReader { placement in
///     if placement == .expanded {
///         DetailedAccessoryView()
///     } else {
///         CompactAccessoryView()
///     }
/// }
/// ```
@available(iOS 26.0, macOS 26.0, watchOS 26.0, visionOS 26.0, *)
@available(tvOS, unavailable)
public struct AdaptiveTabViewBottomAccessoryPlacementReader<Content: View>: View {
    private let content: (AdaptiveBottomAccessoryPlacement) -> Content

    @Environment(\.tabViewBottomAccessoryPlacement) private var placement

    /// Creates a placement reader.
    ///
    /// - Parameter content: A view builder that receives the current placement.
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
            case .inline:   return .inline
            case .expanded: return .expanded
            default:        return .none
            }
        } else {
            return .none
        }
        #else
        return .none
        #endif
    }
}
