import SwiftUI

// ╔══════════════════════════════════════════════════════════════════╗
// ║  AdaptiveTabViewComponents — Components Layer                   ║
// ║  Concrete types for Tab Views group                             ║
// ║  File: Components/AdaptiveTabViewComponents.swift               ║
// ╚══════════════════════════════════════════════════════════════════╝

// MARK: - AdaptiveValueTab (Items #17, #18, #19)

/// Creates a `Tab` with a typed selection value and optional search role.
///
/// Covers feed items:
/// - #17 TabView (new Tab init with title/systemImage)
/// - #18 Search Tab Role (role: .search)
/// - #19 Value Tab View (Tab with Hashable value)
///
/// Usage:
/// ```swift
/// TabView(selection: $selection) {
///     AdaptiveValueTab("Home", systemImage: "house", value: "home") {
///         HomeView()
///     }
///     AdaptiveValueTab("Search", systemImage: "magnifyingglass", value: "search", role: .search) {
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

@available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *)
public struct AdaptiveTabSection<Value: Hashable, Content: TabContent<Value>>: TabContent {
    private let title: LocalizedStringKey?
    private let content: () -> Content

    public init(
        _ title: LocalizedStringKey,
        @TabContentBuilder<Value> content: @escaping () -> Content
    ) {
        self.title = title
        self.content = content
    }

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

/// Reads the `tabViewBottomAccessoryPlacement` environment value on iOS 26+.
///
/// Covers feed item #98: Inspect whether the bottom accessory is inline or expanded.
///
/// Usage:
/// ```swift
/// AdaptiveTabViewBottomAccessoryPlacementReader { placement in
///     switch placement {
///     case .inline:   Text("Inline")
///     case .expanded: Text("Expanded")
///     case .none:     EmptyView()
///     }
/// }
/// ```
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
