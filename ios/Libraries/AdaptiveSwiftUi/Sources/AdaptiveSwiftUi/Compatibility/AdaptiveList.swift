import SwiftUI

public enum AdaptiveListSectionSpacing: Sendable {
    case `default`
    case compact
    case custom(CGFloat)
}

public enum AdaptiveBadgeProminence: Sendable {
    case increased
    case standard
    case decreased
}

public enum AdaptiveBackgroundProminence: Sendable {
    case standard
    case increased
}

public extension View {
    @ViewBuilder
    func adaptiveListSectionMargins(
        _ edges: Edge.Set = .all,
        _ length: CGFloat?
    ) -> some View {
        #if os(iOS) || os(visionOS)
        if #available(iOS 26.0, visionOS 26.0, *) {
            self.listSectionMargins(edges, length)
        } else {
            self
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    func adaptiveListSectionSpacing(_ spacing: AdaptiveListSectionSpacing) -> some View {
        #if os(iOS) || os(watchOS) || os(visionOS)
        if #available(iOS 17.0, watchOS 10.0, visionOS 1.0, *) {
            switch spacing {
            case .default:
                self.listSectionSpacing(.default)
            case .compact:
                self.listSectionSpacing(.compact)
            case let .custom(value):
                self.listSectionSpacing(.custom(value))
            }
        } else {
            self
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    func adaptiveListSectionSpacing(_ spacing: CGFloat) -> some View {
        #if os(iOS) || os(watchOS) || os(visionOS)
        if #available(iOS 17.0, watchOS 10.0, visionOS 1.0, *) {
            self.listSectionSpacing(spacing)
        } else {
            self
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    func adaptiveListSectionSpacingCompact() -> some View {
        adaptiveListSectionSpacing(.compact)
    }

    @ViewBuilder
    func adaptiveListRowSpacing(_ spacing: CGFloat?) -> some View {
        #if os(iOS) || os(visionOS)
        if #available(iOS 15.0, visionOS 1.0, *) {
            self.listRowSpacing(spacing)
        } else {
            self
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    func adaptiveListRowSeparator(
        _ visibility: Visibility,
        edges: VerticalEdge.Set = .all
    ) -> some View {
        #if os(iOS) || os(macOS) || os(visionOS)
        if #available(iOS 15.0, macOS 13.0, visionOS 1.0, *) {
            self.listRowSeparator(visibility, edges: edges)
        } else {
            self
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    func adaptiveListSectionSeparator(
        _ visibility: Visibility,
        edges: VerticalEdge.Set = .all
    ) -> some View {
        #if os(iOS) || os(macOS) || os(visionOS)
        if #available(iOS 15.0, macOS 13.0, visionOS 1.0, *) {
            self.listSectionSeparator(visibility, edges: edges)
        } else {
            self
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    func adaptiveListRowSeparatorTint(
        _ tint: Color?,
        edges: VerticalEdge.Set = .all
    ) -> some View {
        if let tint {
            #if os(iOS) || os(macOS) || os(visionOS)
            if #available(iOS 15.0, macOS 13.0, visionOS 1.0, *) {
                self.listRowSeparatorTint(tint, edges: edges)
            } else {
                self
            }
            #else
            self
            #endif
        } else {
            self
        }
    }

    @ViewBuilder
    func adaptiveListSectionSeparatorTint(
        _ tint: Color?,
        edges: VerticalEdge.Set = .all
    ) -> some View {
        if let tint {
            #if os(iOS) || os(macOS) || os(visionOS)
            if #available(iOS 15.0, macOS 13.0, visionOS 1.0, *) {
                self.listSectionSeparatorTint(tint, edges: edges)
            } else {
                self
            }
            #else
            self
            #endif
        } else {
            self
        }
    }

    @ViewBuilder
    func adaptiveListRowBackground<Background: View>(
        @ViewBuilder _ background: () -> Background
    ) -> some View {
        self.listRowBackground(background())
    }

    @ViewBuilder
    func adaptiveListBadgeProminence(_ prominence: AdaptiveBadgeProminence) -> some View {
        #if os(iOS) || os(macOS) || os(visionOS)
        if #available(iOS 17.0, macOS 14.0, visionOS 1.0, *) {
            switch prominence {
            case .increased:
                self.badgeProminence(.increased)
            case .standard:
                self.badgeProminence(.standard)
            case .decreased:
                self.badgeProminence(.decreased)
            }
        } else {
            self
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    func adaptiveListBadge(_ value: Int) -> some View {
        #if os(iOS) || os(macOS) || os(visionOS)
        if #available(iOS 15.0, macOS 12.0, visionOS 1.0, *) {
            self.badge(value)
        } else {
            self
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    func adaptiveListBadge(_ value: String) -> some View {
        #if os(iOS) || os(macOS) || os(visionOS)
        if #available(iOS 15.0, macOS 12.0, visionOS 1.0, *) {
            self.badge(value)
        } else {
            self
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    func adaptiveHeaderProminence(_ prominence: Prominence) -> some View {
        #if os(iOS) || os(macOS) || os(tvOS) || os(watchOS) || os(visionOS)
        if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, visionOS 1.0, *) {
            self.headerProminence(prominence)
        } else {
            self
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    func adaptiveRefreshable(action: @escaping @Sendable () async -> Void) -> some View {
        #if os(iOS) || os(macOS) || os(tvOS) || os(watchOS) || os(visionOS)
        if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, visionOS 1.0, *) {
            self.refreshable {
                await action()
            }
        } else {
            self
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    func adaptiveSwipeActions<Actions: View>(
        edge: HorizontalEdge = .trailing,
        allowsFullSwipe: Bool = true,
        @ViewBuilder content: @escaping () -> Actions
    ) -> some View {
        #if os(iOS) || os(macOS) || os(watchOS) || os(visionOS)
        if #available(iOS 15.0, macOS 12.0, watchOS 8.0, visionOS 1.0, *) {
            self.swipeActions(edge: edge, allowsFullSwipe: allowsFullSwipe) {
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
    func adaptiveListSectionIndexVisibility(_ visibility: Visibility = .automatic) -> some View {
        #if os(iOS) || os(watchOS) || os(visionOS)
        if #available(iOS 26.0, watchOS 26.0, visionOS 26.0, *) {
            self.listSectionIndexVisibility(visibility)
        } else {
            self
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    func adaptiveSectionIndexLabel<S: StringProtocol>(_ label: S) -> some View {
        #if os(iOS) || os(watchOS) || os(visionOS)
        if #available(iOS 26.0, watchOS 26.0, visionOS 26.0, *) {
            self.sectionIndexLabel(String(label))
        } else {
            self
        }
        #else
        self
        #endif
    }

    @ViewBuilder
    func adaptiveBackgroundProminence(_ prominence: AdaptiveBackgroundProminence) -> some View {
        #if os(iOS) || os(macOS) || os(watchOS) || os(tvOS) || os(visionOS)
        if #available(iOS 17.0, macOS 14.0, watchOS 10.0, tvOS 17.0, visionOS 1.0, *) {
            switch prominence {
            case .standard:
                self.environment(\.backgroundProminence, .standard)
            case .increased:
                self.environment(\.backgroundProminence, .increased)
            }
        } else {
            self
        }
        #else
        self
        #endif
    }
}
