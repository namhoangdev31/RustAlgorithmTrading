import SwiftUI

public enum AdaptiveContainerBackgroundPlacement: Sendable {
    case navigation
    case navigationSplitView
}

public enum AdaptiveToolbarTitlePlacement: Sendable {
    case automatic
    case title
    case subtitle
    case largeTitle
    case largeSubtitle
}

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

    public static func adaptive(_ placement: AdaptiveToolbarTitlePlacement) -> ToolbarItemPlacement
    {
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
    @ToolbarContentBuilder
    @available(tvOS, unavailable)
    @available(watchOS, unavailable)
    public func adaptiveSharedBackgroundVisibility(_ visibility: Visibility) -> some ToolbarContent
    {
        if #available(iOS 26.0, macOS 26.0, *) {
            self.sharedBackgroundVisibility(visibility)
        } else {
            self
        }
    }
}

extension View {
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
    public func adaptiveContainerBackground<S: ShapeStyle>(
        _ style: S,
        for placement: AdaptiveContainerBackgroundPlacement = .navigation
    ) -> some View {
        switch placement {
        case .navigation:
            #if os(iOS) || os(watchOS)
                if #available(iOS 18.0, watchOS 11.0, *) {
                    self.containerBackground(style, for: .navigation)
                } else {
                    self
                }
            #else
                self
            #endif
        case .navigationSplitView:
            #if os(iOS) || os(watchOS)
                if #available(iOS 18.0, watchOS 11.0, *) {
                    self.containerBackground(style, for: .navigationSplitView)
                } else {
                    self
                }
            #else
                self
            #endif
        }
    }

    @ViewBuilder
    public func adaptiveContainerBackground<Background: View>(
        for placement: AdaptiveContainerBackgroundPlacement = .navigation,
        alignment: Alignment = .center,
        @ViewBuilder content: () -> Background
    ) -> some View {
        switch placement {
        case .navigation:
            #if os(iOS) || os(watchOS)
                if #available(iOS 18.0, watchOS 11.0, *) {
                    self.containerBackground(
                        for: .navigation, alignment: alignment, content: content)
                } else {
                    self
                }
            #else
                self
            #endif
        case .navigationSplitView:
            #if os(iOS) || os(watchOS)
                if #available(iOS 18.0, watchOS 11.0, *) {
                    self.containerBackground(
                        for: .navigationSplitView, alignment: alignment, content: content)
                } else {
                    self
                }
            #else
                self
            #endif
        }
    }

    @ViewBuilder
    public func adaptiveScrollEdgeHardEffect(isEnabled: Bool = true) -> some View {
        if isEnabled {
            if #available(iOS 26.0, macOS 26.0, tvOS 26.0, watchOS 26.0, *) {
                self.scrollEdgeEffectStyle(.hard, for: .all)
            } else {
                self
            }
        } else {
            self
        }
    }
}
