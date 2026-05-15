import SwiftUI

/// Defines placements for title items in a toolbar, specifically supporting iOS 26+ title/subtitle tiers.

/// Sizing behavior for toolbar spacers.

extension ToolbarItemPlacement {
    private static var fallbackTitlePlacement: ToolbarItemPlacement {
        #if os(watchOS)
        return .automatic
        #else
        return .principal
        #endif
    }

    /// Returns a native `ToolbarItemPlacement` that adapts to the current OS version.
    ///
    /// This static method allows you to use modern iOS 26+ title placements while ensuring 
    /// functional fallback on older systems:
    /// - **iOS 26+**: Uses native `.title`, `.subtitle`, `.largeTitle`, etc.
    /// - **Legacy**: Falls back to `.principal` (on iOS/tvOS) or `.automatic` (on watchOS).
    ///
    /// Example:
    /// ```swift
    /// ToolbarItem(placement: .adaptive(.subtitle)) {
    ///     Text("Syncing...")
    /// }
    /// ```
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

/// A standard space item in toolbars that adapts to modern `ToolbarSpacer` APIs.
///
/// `AdaptiveToolbarSpacer` provides a unified way to add spacing in toolbars:
/// - **iOS 26+**: Maps to native `ToolbarSpacer`.
/// - **Legacy**: Falls back to a `ToolbarItem` containing a standard `Spacer`.
///
/// Example:
/// ```swift
/// ToolbarItemGroup {
///     Button(...)
///     AdaptiveToolbarSpacer(.flexible)
///     Button(...)
/// }
/// ```
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
    
    /// Controls the visibility of the shared background effect (e.g., glass) on toolbar items.
    ///
    /// Maps to the native `sharedBackgroundVisibility` on iOS 26+ and macOS 26+.
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
    
    /// Configures the view’s subtitle for navigation purposes with cross-platform support.
    ///
    /// This modifier handles subtitle display:
    /// - **iOS 26+ / macOS 11+**: Uses native `.navigationSubtitle`.
    /// - **Legacy Fallback**: Gracefully ignores the modifier on older iOS versions.
    ///
    /// Example:
    /// ```swift
    /// View()
    ///     .adaptiveNavigationSubtitle(Text("Updated 5m ago"))
    /// ```
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

    /// Configures the view’s subtitle using a localized string key.
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

    /// Configures the view’s subtitle using a string protocol.
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
