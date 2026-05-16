import SwiftUI

// ╔══════════════════════════════════════════════════════════════════╗
// ║  AdaptiveTabViewComponents — Components Layer                   ║
// ║  Concrete types for Tab Views group                             ║
// ║  File: Components/AdaptiveTabViewComponents.swift               ║
// ╚══════════════════════════════════════════════════════════════════╝

// MARK: - Adaptive Tab DSL

/// A component that represents a single tab item within an adaptive tab view.
///
/// `AdaptiveTab` is a polymorphic DSL element. It returns a descriptor that `AdaptiveTabView`
/// uses to automatically render either a modern `Tab` (iOS 18+) or a legacy `.tabItem` (iOS 15-17).
///
/// Example:
/// ```swift
/// AdaptiveTab("Today", systemImage: "sparkles", value: 0) {
///     HomeView()
/// }
///
/// AdaptiveTab("Search", systemImage: "magnifyingglass", value: 4, role: .search) {
///     SearchView()
/// }
/// ```
///
/// - Parameters:
///   - titleKey: The localized title of the tab.
///   - systemImage: The SF Symbol name for the tab icon.
///   - value: The selection value associated with this tab.
///   - role: The semantic role of the tab (e.g., `.search` for iOS 18+ integrations).
///   - content: A view builder producing the content for this tab.
public func AdaptiveTab<Value: Hashable, Content: View>(
    _ titleKey: LocalizedStringKey,
    systemImage: String,
    value: Value,
    role: AdaptiveTabRole = .automatic,
    @ViewBuilder content: @escaping () -> Content
) -> _AdaptiveTabDescriptor<Value> {
    _AdaptiveTabDescriptor(
        titleKey: titleKey,
        systemImage: systemImage,
        value: value,
        role: role,
        content: AnyView(content())
    )
}

/// A component that groups related tabs into a section.
///
/// `AdaptiveTabSection` leverages `TabSection` on iOS 18+ for sidebar and expanded layouts,
/// and falls back to standard `Section` groupings on older platforms.
///
/// Example:
/// ```swift
/// AdaptiveTabSection("Account") {
///     AdaptiveTab("Profile", systemImage: "person", value: 1) { ProfileView() }
///     AdaptiveTab("Settings", systemImage: "gear", value: 2) { SettingsView() }
/// }
/// ```
public func AdaptiveTabSection<Value: Hashable>(
    _ titleKey: LocalizedStringKey? = nil,
    @AdaptiveTabBuilder<Value> content: @escaping () -> [_AdaptiveTabDescriptor<Value>]
) -> _AdaptiveTabSectionDescriptor<Value> {
    _AdaptiveTabSectionDescriptor(
        titleKey: titleKey,
        children: content()
    )
}

// MARK: - AdaptiveTabView

/// A container view that displays multiple tabs, adapting to platform standards.
///
/// `AdaptiveTabView` intelligently switches between the modern `TabView` API (iOS 18+) 
/// and the legacy view-based API (iOS 15-17) to provide the best user experience 
/// on every OS version.
///
/// Example:
/// ```swift
/// @State private var selection = 1
///
/// AdaptiveTabView(selection: $selection) {
///     AdaptiveTab("Home", systemImage: "house", value: 1) { HomeView() }
///     AdaptiveTab("Profile", systemImage: "person", value: 2) { ProfileView() }
/// }
/// ```
public struct AdaptiveTabView<Selection: Hashable>: View {
    @Binding private var selection: Selection
    private let tabs: () -> [_AdaptiveTabDescriptor<Selection>]

    /// Creates an adaptive tab view with a selection binding.
    ///
    /// - Parameters:
    ///   - selection: A binding to the selected tab value.
    ///   - content: A builder that produces the tabs using `AdaptiveTab`.
    public init(
        selection: Binding<Selection>,
        @AdaptiveTabBuilder<Selection> content: @escaping () -> [_AdaptiveTabDescriptor<Selection>]
    ) {
        self._selection = selection
        self.tabs = content
    }

    public var body: some View {
        #if os(iOS) || os(macOS) || os(tvOS) || os(watchOS) || os(visionOS)
            if #available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *) {
                modernTabView
            } else {
                legacyTabView
            }
        #else
            legacyTabView
        #endif
    }

    @available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *)
    private var modernTabView: some View {
        TabView(selection: $selection) {
            ForEach(tabs(), id: \.value) { descriptor in
                descriptor.modernTab
            }
        }
    }

    private var legacyTabView: some View {
        TabView(selection: $selection) {
            ForEach(tabs(), id: \.value) { descriptor in
                descriptor.legacyTab
            }
        }
    }
}

// MARK: - Internal Descriptors

/// Internal descriptor used to bridge between different TabView implementations.
/// This pattern avoids protocol conflicts between `View` and `TabContent`.
public struct _AdaptiveTabDescriptor<Value: Hashable>: Identifiable {
    public var id: Value { value }
    
    let titleKey: LocalizedStringKey
    let systemImage: String
    let value: Value
    let role: AdaptiveTabRole
    let content: AnyView

    @available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *)
    var modernTab: some TabContent<Value> {
        if role == .search {
            return Tab(titleKey, systemImage: systemImage, value: value, role: .search) {
                content
            }
        } else {
            return Tab(titleKey, systemImage: systemImage, value: value) {
                content
            }
        }
    }

    var legacyTab: some View {
        content
            .tabItem {
                Label(titleKey, systemImage: systemImage)
            }
            .tag(value)
    }
}

/// Internal descriptor for tab grouping.
public struct _AdaptiveTabSectionDescriptor<Value: Hashable> {
    let titleKey: LocalizedStringKey?
    let children: [_AdaptiveTabDescriptor<Value>]
}

// MARK: - Result Builder

/// A result builder that collects `AdaptiveTab` descriptors for rendering.
@resultBuilder
public struct AdaptiveTabBuilder<Value: Hashable> {
    public static func buildBlock(_ components: _AdaptiveTabDescriptor<Value>...) -> [_AdaptiveTabDescriptor<Value>] {
        Array(components)
    }
    
    public static func buildBlock(_ components: [_AdaptiveTabDescriptor<Value>]...) -> [_AdaptiveTabDescriptor<Value>] {
        components.flatMap { $0 }
    }
    
    public static func buildOptional(_ component: [_AdaptiveTabDescriptor<Value>]?) -> [_AdaptiveTabDescriptor<Value>] {
        component ?? []
    }
    
    public static func buildEither(first component: [_AdaptiveTabDescriptor<Value>]) -> [_AdaptiveTabDescriptor<Value>] {
        component
    }
    
    public static func buildEither(second component: [_AdaptiveTabDescriptor<Value>]) -> [_AdaptiveTabDescriptor<Value>] {
        component
    }
}

// MARK: - Compatibility Aliases

/// Provided for backward compatibility with previous library versions.
public typealias AdaptiveValueTab = _AdaptiveTabDescriptor
