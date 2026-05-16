import SwiftUI

// MARK: - Toolbar Item Placement Adaptability

extension ToolbarItemPlacement {
    private static var fallbackTitlePlacement: ToolbarItemPlacement {
        #if os(watchOS)
        return .automatic
        #else
        return .principal
        #endif
    }

    /// Returns a native `ToolbarItemPlacement` that adapts to the current OS version,
    /// leveraging iOS 26+ title area placements when available.
    public static func adaptive(_ placement: AdaptiveToolbarTitlePlacement) -> ToolbarItemPlacement {
        switch placement {
        case .automatic:
            return .automatic
        case .title:
            #if os(iOS)
            if #available(iOS 26.0, *) {
                return .title
            }
            #endif
            return fallbackTitlePlacement
        case .subtitle:
            #if os(iOS)
            if #available(iOS 26.0, *) {
                return .subtitle
            }
            #endif
            return fallbackTitlePlacement
        case .largeTitle:
            #if os(iOS)
            if #available(iOS 26.0, *) {
                return .largeTitle
            }
            #endif
            return fallbackTitlePlacement
        case .largeSubtitle:
            #if os(iOS)
            if #available(iOS 26.0, *) {
                return .largeSubtitle
            }
            #endif
            return fallbackTitlePlacement
        }
    }
}

// MARK: - Adaptive Toolbar Spacer

/// A standard space item in toolbars.
/// 
/// This component conforms to `View` to allow usage inside `ToolbarItemGroup` or `ToolbarItem`.
/// To use it directly as a top-level item in `.toolbar`, use `ToolbarItem { AdaptiveToolbarSpacer(...) }`.
@available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, visionOS 1.0, *)
public struct AdaptiveToolbarSpacer: View {
    private let sizing: AdaptiveToolbarSpacerSizing
    private let fallbackLength: CGFloat?

    /// Creates an adaptive toolbar spacer view.
    /// - Parameters:
    ///   - sizing: The sizing behavior (.fixed or .flexible).
    ///   - fallbackLength: The width used for .fixed sizing.
    public init(
        _ sizing: AdaptiveToolbarSpacerSizing = .fixed,
        fallbackLength: CGFloat? = 12
    ) {
        self.sizing = sizing
        self.fallbackLength = fallbackLength
    }

    public var body: some View {
        if sizing == .fixed {
            if let length = fallbackLength {
                Spacer()
                    .frame(width: length)
            } else {
                Spacer()
                    .frame(width: 8)
            }
        } else {
            Spacer()
        }
    }
}

/// A standard space item in toolbars that adapts to iOS 26 `ToolbarSpacer` API.
/// 
/// Use this component directly inside `.toolbar { ... }`.
@available(iOS 16.0, macOS 13.0, tvOS 16.0, watchOS 9.0, visionOS 1.0, *)
public struct AdaptiveToolbarItemSpacer: ToolbarContent {
    private let sizing: AdaptiveToolbarSpacerSizing
    private let placement: ToolbarItemPlacement
    private let fallbackLength: CGFloat?

    public init(
        _ sizing: AdaptiveToolbarSpacerSizing = .fixed,
        placement: ToolbarItemPlacement = .automatic,
        fallbackLength: CGFloat? = 12
    ) {
        self.sizing = sizing
        self.placement = placement
        self.fallbackLength = fallbackLength
    }

    @ToolbarContentBuilder
    public var body: some ToolbarContent {
        #if os(iOS) || os(macOS)
        if #available(iOS 26.0, macOS 26.0, *) {
            ToolbarSpacer(sizing == .fixed ? .fixed : .flexible, placement: placement)
        } else {
            ToolbarItem(placement: placement) {
                AdaptiveToolbarSpacer(sizing, fallbackLength: fallbackLength)
            }
        }
        #else
        ToolbarItem(placement: placement) {
            AdaptiveToolbarSpacer(sizing, fallbackLength: fallbackLength)
        }
        #endif
    }
}

// MARK: - Toolbar Content Modifiers

@available(iOS 16.0, macOS 13.0, tvOS 16.0, watchOS 9.0, visionOS 1.0, *)
extension ToolbarContent {
    /// Controls the visibility of the glass background effect on items in the toolbar.
    /// On iOS 26+ and macOS 26+, this leverages `sharedBackgroundVisibility`.
    @ToolbarContentBuilder
    public func adaptiveSharedBackgroundVisibility(_ visibility: Visibility) -> some ToolbarContent {
        #if os(iOS) || os(macOS)
        if #available(iOS 26.0, macOS 26.0, *) {
            self.sharedBackgroundVisibility(visibility)
        } else {
            self
        }
        #else
        self
        #endif
    }

    /// Identifies this toolbar content as the source of a navigation transition,
    /// such as a zoom transition. Supports iOS 26+ native API.
    @ToolbarContentBuilder
    public func adaptiveMatchedTransitionSource(id: some Hashable, in namespace: Namespace.ID) -> some ToolbarContent {
        #if os(iOS)
        if #available(iOS 26.0, *) {
            self.matchedTransitionSource(id: id, in: namespace)
        } else {
            self
        }
        #else
        self
        #endif
    }
}

// MARK: - Navigation Subtitle Modifiers

extension View {
    /// Configures the view’s subtitle for purposes of navigation.
    /// Supports iOS 26+ `navigationSubtitle` and macOS 11+ native API.
    @ViewBuilder
    public func adaptiveNavigationSubtitle(_ subtitle: Text) -> some View {
        #if os(iOS) || os(macOS)
        if #available(iOS 26.0, macOS 11.0, *) {
            self.navigationSubtitle(subtitle)
        } else {
            self
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    public func adaptiveNavigationSubtitle(_ subtitle: LocalizedStringKey) -> some View {
        #if os(iOS) || os(macOS)
        if #available(iOS 26.0, macOS 11.0, *) {
            self.navigationSubtitle(subtitle)
        } else {
            self
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    public func adaptiveNavigationSubtitle<S: StringProtocol>(_ subtitle: S) -> some View {
        #if os(iOS) || os(macOS)
        if #available(iOS 26.0, macOS 11.0, *) {
            self.navigationSubtitle(subtitle)
        } else {
            self
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    public func adaptiveToolbar(removing kind: AdaptiveToolbarDefaultItemKind) -> some View {
        #if os(iOS) || os(macOS) || os(tvOS) || os(watchOS) || os(visionOS)
        switch kind {
        case .sidebarToggle:
            if #available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, *) {
                self.toolbar(removing: .sidebarToggle)
            } else {
                self
            }
        case .title:
            #if !os(tvOS) && !os(watchOS)
            if #available(iOS 18.0, macOS 15.0, visionOS 2.0, *) {
                self.toolbar(removing: .title)
            } else {
                self
            }
            #else
            self
            #endif
        case .search:
            #if !os(tvOS) && !os(watchOS)
            if #available(iOS 26.0, macOS 26.0, *) {
                self.toolbar(removing: .search)
            } else {
                self
            }
            #else
            self
            #endif
        }
        #else
        self
        #endif
    }
}
