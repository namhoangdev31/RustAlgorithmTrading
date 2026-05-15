import SwiftUI

public enum AdaptiveListStyleType: Sendable {
    case automatic
    case plain
    case grouped
    case insetGrouped
    case sidebar
    case inset
    case elliptical // watchOS
    case carousel   // watchOS
    case bordered   // macOS
}

extension View {
    @ViewBuilder
    public func adaptiveListStyle(_ style: AdaptiveListStyleType) -> some View {
        switch style {
        case .automatic:
            self.listStyle(.automatic)
        case .plain:
            self.listStyle(.plain)
        case .grouped:
            #if os(iOS) || os(tvOS) || os(visionOS)
            self.listStyle(.grouped)
            #else
            self.listStyle(.automatic)
            #endif
        case .insetGrouped:
            #if os(iOS) || os(visionOS)
            if #available(iOS 14.0, visionOS 1.0, *) {
                self.listStyle(.insetGrouped)
            } else {
                self.listStyle(.grouped)
            }
            #else
            self.listStyle(.automatic)
            #endif
        case .sidebar:
            #if os(iOS) || os(macOS) || os(visionOS)
            if #available(iOS 14.0, macOS 11.0, visionOS 1.0, *) {
                self.listStyle(.sidebar)
            } else {
                self.listStyle(.automatic)
            }
            #else
            self.listStyle(.automatic)
            #endif
        case .inset:
            #if os(iOS) || os(macOS) || os(visionOS)
            if #available(iOS 14.0, macOS 11.0, visionOS 1.0, *) {
                self.listStyle(.inset)
            } else {
                self.listStyle(.plain)
            }
            #else
            self.listStyle(.automatic)
            #endif
        case .elliptical:
            #if os(watchOS)
            if #available(watchOS 7.0, *) {
                self.listStyle(.elliptical)
            } else {
                self.listStyle(.automatic)
            }
            #else
            self.listStyle(.automatic)
            #endif
        case .carousel:
            #if os(watchOS)
            self.listStyle(.carousel)
            #else
            self.listStyle(.automatic)
            #endif
        case .bordered:
            #if os(macOS)
            if #available(macOS 12.0, *) {
                self.listStyle(.bordered)
            } else {
                self.listStyle(.automatic)
            }
            #else
            self.listStyle(.automatic)
            #endif
        }
    }
    
    // MARK: - Separators
    
    @ViewBuilder
    public func adaptiveListRowSeparator(_ visibility: Visibility) -> some View {
        #if os(iOS) || os(macOS) || os(visionOS)
        if #available(iOS 15.0, macOS 13.0, visionOS 1.0, *) {
            self.listRowSeparator(visibility)
        } else {
            self
        }
        #else
        self
        #endif
    }
    
    @ViewBuilder
    public func adaptiveListSectionSeparator(_ visibility: Visibility) -> some View {
        #if os(iOS) || os(macOS) || os(visionOS)
        if #available(iOS 15.0, macOS 13.0, visionOS 1.0, *) {
            self.listSectionSeparator(visibility)
        } else {
            self
        }
        #else
        self
        #endif
    }
    
    @ViewBuilder
    public func adaptiveListRowSeparatorTint(_ color: Color?) -> some View {
        #if os(iOS) || os(macOS) || os(visionOS)
        if #available(iOS 15.0, macOS 13.0, visionOS 1.0, *) {
            self.listRowSeparatorTint(color)
        } else {
            self
        }
        #else
        self
        #endif
    }
    
    @ViewBuilder
    public func adaptiveListSectionSeparatorTint(_ color: Color?) -> some View {
        #if os(iOS) || os(macOS) || os(visionOS)
        if #available(iOS 15.0, macOS 13.0, visionOS 1.0, *) {
            self.listSectionSeparatorTint(color)
        } else {
            self
        }
        #else
        self
        #endif
    }
    
    // MARK: - Spacing & Margins
    
    @ViewBuilder
    public func adaptiveListRowSpacing(_ spacing: CGFloat?) -> some View {
        #if os(iOS) || os(visionOS) || os(macOS) || os(watchOS) || os(tvOS)
        if #available(iOS 15.0, macOS 13.0, watchOS 8.0, tvOS 15.0, visionOS 1.0, *) {
            self.listRowSpacing(spacing ?? 0)
        } else {
            self
        }
        #else
        self
        #endif
    }
    
    public enum AdaptiveListSectionSpacing: Sendable {
        case `default`
        case compact
        case custom(CGFloat)
    }

    @ViewBuilder
    public func adaptiveListSectionSpacing(_ spacing: AdaptiveListSectionSpacing) -> some View {
        #if os(iOS) || os(watchOS) || os(visionOS)
        if #available(iOS 17.0, watchOS 10.0, visionOS 1.0, *) {
            switch spacing {
            case .default:
                self.listSectionSpacing(.default)
            case .compact:
                self.listSectionSpacing(.compact)
            case .custom(let val):
                self.listSectionSpacing(val)
            }
        } else {
            self
        }
        #else
        self
        #endif
    }
    
    public enum AdaptiveBackgroundProminence: Sendable {
        case standard
        case increased
    }
    
    @ViewBuilder
    public func adaptiveBackgroundProminence(_ prominence: AdaptiveBackgroundProminence) -> some View {
        #if os(iOS) || os(macOS) || os(watchOS) || os(tvOS) || os(visionOS)
        if #available(iOS 17.0, macOS 14.0, watchOS 10.0, tvOS 17.0, visionOS 1.0, *) {
            switch prominence {
            case .standard:
                self.backgroundProminence(.standard)
            case .increased:
                self.backgroundProminence(.increased)
            }
        } else {
            self
        }
        #else
        self
        #endif
    }
    
    @ViewBuilder
    public func adaptiveListSectionMargins(_ edges: Edge.Set, _ length: CGFloat?) -> some View {
        #if os(iOS) || os(visionOS) || os(macOS) || os(watchOS) || os(tvOS)
        // iOS 26+ API as per exploreswiftui_feed.json
        if #available(iOS 26.0, macOS 26.0, tvOS 26.0, watchOS 26.0, visionOS 26.0, *) {
            self.listSectionMargins(edges, length)
        } else {
            self
        }
        #else
        self
        #endif
    }
    
    // MARK: - Badges
    
    @ViewBuilder
    public func adaptiveBadge(_ count: Int) -> some View {
        #if os(iOS) || os(macOS) || os(visionOS)
        if #available(iOS 15.0, macOS 12.0, visionOS 1.0, *) {
            self.badge(count)
        } else {
            self
        }
        #else
        self
        #endif
    }
    
    @ViewBuilder
    public func adaptiveBadge(_ string: String) -> some View {
        #if os(iOS) || os(macOS) || os(visionOS)
        if #available(iOS 15.0, macOS 12.0, visionOS 1.0, *) {
            self.badge(string)
        } else {
            self
        }
        #else
        self
        #endif
    }
    
    // MARK: - Interactions
    
    @ViewBuilder
    public func adaptiveSwipeActions<T: View>(edge: HorizontalEdge = .trailing, allowsFullSwipe: Bool = true, @ViewBuilder content: () -> T) -> some View {
        #if os(iOS) || os(macOS) || os(watchOS) || os(visionOS)
        if #available(iOS 15.0, macOS 12.0, watchOS 8.0, visionOS 1.0, *) {
            self.swipeActions(edge: edge, allowsFullSwipe: allowsFullSwipe, content: content)
        } else {
            self
        }
        #else
        self
        #endif
    }
    
    @ViewBuilder
    public func adaptiveRefreshable(action: @escaping @Sendable () async -> Void) -> some View {
        #if os(iOS) || os(macOS) || os(watchOS) || os(tvOS) || os(visionOS)
        if #available(iOS 15.0, macOS 12.0, watchOS 8.0, tvOS 15.0, visionOS 1.0, *) {
            self.refreshable(action: action)
        } else {
            self
        }
        #else
        self
        #endif
    }
    
    // MARK: - Interactions (Continued)
    
    @ViewBuilder
    public func adaptiveMoveDisabled(_ isDisabled: Bool) -> some View {
        if #available(iOS 13.0, macOS 10.15, tvOS 13.0, watchOS 6.0, visionOS 1.0, *) {
            self.moveDisabled(isDisabled)
        } else {
            self
        }
    }
    
    @ViewBuilder
    public func adaptiveDeleteDisabled(_ isDisabled: Bool) -> some View {
        if #available(iOS 13.0, macOS 10.15, tvOS 13.0, watchOS 6.0, visionOS 1.0, *) {
            self.deleteDisabled(isDisabled)
        } else {
            self
        }
    }

    // MARK: - Prominence & Backgrounds
    
    @ViewBuilder
    public func adaptiveBadgeProminence(_ prominence: BadgeProminence) -> some View {
        #if os(iOS) || os(macOS) || os(visionOS)
        if #available(iOS 17.0, macOS 14.0, visionOS 1.0, *) {
            self.badgeProminence(prominence)
        } else {
            self
        }
        #else
        self
        #endif
    }
    
    @ViewBuilder
    public func adaptiveHeaderProminence(_ prominence: Prominence) -> some View {
        #if os(iOS) || os(macOS) || os(watchOS) || os(tvOS) || os(visionOS)
        if #available(iOS 15.0, macOS 12.0, watchOS 8.0, tvOS 15.0, visionOS 1.0, *) {
            self.headerProminence(prominence)
        } else {
            self
        }
        #else
        self
        #endif
    }
    
    @ViewBuilder
    public func adaptiveListItemTint(_ tint: Color?) -> some View {
        #if os(iOS) || os(macOS) || os(watchOS) || os(tvOS) || os(visionOS)
        if #available(iOS 14.0, macOS 11.0, watchOS 7.0, tvOS 14.0, visionOS 1.0, *) {
            if let tint {
                self.listItemTint(tint)
            } else {
                self.listItemTint(nil)
            }
        } else {
            self
        }
        #else
        self
        #endif
    }
    
    @ViewBuilder
    public func adaptiveListRowBackground<V: View>(_ view: V?) -> some View {
        if #available(iOS 13.0, macOS 10.15, watchOS 6.0, tvOS 13.0, visionOS 1.0, *) {
            self.listRowBackground(view)
        } else {
            self
        }
    }
    
    @ViewBuilder
    public func adaptiveListRowInsets(_ insets: EdgeInsets?) -> some View {
        if #available(iOS 13.0, macOS 10.15, watchOS 6.0, tvOS 13.0, visionOS 1.0, *) {
            self.listRowInsets(insets)
        } else {
            self
        }
    }

    // MARK: - Section Index (iOS 26)
    
    @ViewBuilder
    public func adaptiveSectionIndexLabel(_ label: String) -> some View {
        #if os(iOS) || os(macOS) || os(watchOS) || os(tvOS) || os(visionOS)
        if #available(iOS 26.0, macOS 26.0, watchOS 26.0, tvOS 26.0, visionOS 26.0, *) {
            self.sectionIndexLabel(label)
        } else {
            self
        }
        #else
        self
        #endif
    }
    
    @ViewBuilder
    public func adaptiveListSectionIndexVisibility(_ visibility: Visibility) -> some View {
        #if os(iOS) || os(macOS) || os(watchOS) || os(tvOS) || os(visionOS)
        if #available(iOS 26.0, macOS 26.0, watchOS 26.0, tvOS 26.0, visionOS 26.0, *) {
            self.listSectionIndexVisibility(visibility)
        } else {
            self
        }
        #else
        self
        #endif
    }

    // MARK: - Environment Defaults
    
    @ViewBuilder
    public func adaptiveDefaultMinListHeaderHeight(_ height: CGFloat?) -> some View {
        if #available(iOS 13.0, macOS 10.15, watchOS 6.0, tvOS 13.0, visionOS 1.0, *) {
            self.environment(\.defaultMinListHeaderHeight, height)
        } else {
            self
        }
    }
    
    @ViewBuilder
    public func adaptiveDefaultMinListRowHeight(_ height: CGFloat?) -> some View {
        if #available(iOS 13.0, macOS 10.15, watchOS 6.0, tvOS 13.0, visionOS 1.0, *) {
            self.environment(\.defaultMinListRowHeight, height)
        } else {
            self
        }
    }
}
