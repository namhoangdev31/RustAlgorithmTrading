import SwiftUI

/// Defines placements for title items in a toolbar, specifically supporting iOS 26+ title/subtitle tiers.
public enum AdaptiveToolbarTitlePlacement: Sendable {
    case automatic
    case title
    case subtitle
    case largeTitle
    case largeSubtitle
}

/// Sizing behavior for toolbar spacers.
public enum AdaptiveToolbarSpacerSizing: Sendable {
    case fixed
    case flexible
}

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

/// A standard space item in toolbars that adapts to iOS 26 `ToolbarSpacer` API.
@available(iOS 16.0, macOS 13.0, tvOS 16.0, watchOS 9.0, visionOS 1.0, *)
public struct AdaptiveToolbarSpacer: ToolbarContent {
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
            switch sizing {
            case .fixed:
                ToolbarSpacer(.fixed, placement: placement)
            case .flexible:
                ToolbarSpacer(.flexible, placement: placement)
            }
        } else {
            fallbackItem
        }
        #else
        fallbackItem
        #endif
    }

    private var fallbackItem: some ToolbarContent {
        ToolbarItem(placement: placement) {
            if let fallbackLength {
                Spacer()
                    .frame(width: fallbackLength)
            } else {
                Spacer()
            }
        }
    }
}

@available(iOS 16.0, macOS 13.0, tvOS 16.0, watchOS 9.0, visionOS 1.0, *)
extension ToolbarContent {
    /// Controls the visibility of the glass background effect on items in the toolbar.
    /// On iOS 26+ and macOS 26+, this leverages `sharedBackgroundVisibility`.
    @ToolbarContentBuilder
    @available(tvOS, unavailable)
    @available(watchOS, unavailable)
    public func adaptiveSharedBackgroundVisibility(_ visibility: Visibility) -> some ToolbarContent {
        if #available(iOS 26.0, macOS 26.0, *) {
            self.sharedBackgroundVisibility(visibility)
        } else {
            self
        }
    }
}

extension View {
    /// Configures the view’s subtitle for purposes of navigation.
    /// Supports iOS 26+ `navigationSubtitle` and macOS 11+ native API.
    @ViewBuilder
    @available(tvOS, unavailable)
    @available(watchOS, unavailable)
    public func adaptiveNavigationSubtitle(_ subtitle: Text) -> some View {
        if #available(iOS 26.0, macOS 11.0, *) {
            self.navigationSubtitle(subtitle)
        } else {
            self
        }
    }

    @ViewBuilder
    @available(tvOS, unavailable)
    @available(watchOS, unavailable)
    public func adaptiveNavigationSubtitle(_ subtitle: LocalizedStringKey) -> some View {
        if #available(iOS 26.0, macOS 11.0, *) {
            self.navigationSubtitle(subtitle)
        } else {
            self
        }
    }

    @ViewBuilder
    @available(tvOS, unavailable)
    @available(watchOS, unavailable)
    public func adaptiveNavigationSubtitle<S: StringProtocol>(_ subtitle: S) -> some View {
        if #available(iOS 26.0, macOS 11.0, *) {
            self.navigationSubtitle(subtitle)
        } else {
            self
        }
    }
}
