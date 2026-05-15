import SwiftUI

extension View {
    
    /// Sets the visual style for adaptive lists.
    ///
    /// This modifier maps `AdaptiveListStyleType` to the appropriate native `ListStyle`:
    /// - **Automatic/Plain**: Standard list appearances.
    /// - **Grouped/InsetGrouped**: Hierarchical layouts for iOS/visionOS.
    /// - **Sidebar**: Navigation-focused layout for macOS/iPadOS.
    /// - **WatchOS Styles**: Support for `elliptical` and `carousel`.
    /// - **MacOS Bordered**: Professional data entry style for macOS 12+.
    ///
    /// Example:
    /// ```swift
    /// List { ... }
    ///     .adaptiveListStyle(.insetGrouped)
    /// ```
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

    /// Configures the visibility of the row separator.
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

    /// Configures the visibility of the section separator.
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

    /// Sets the tint color for the row separator.
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

    /// Sets the tint color for the section separator.
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

    /// Sets the vertical spacing between rows.
    @ViewBuilder
    public func adaptiveListRowSpacing(_ spacing: CGFloat?) -> some View {
        #if os(iOS) || os(visionOS) || os(watchOS) || os(tvOS)
            if #available(iOS 15.0, watchOS 8.0, tvOS 15.0, visionOS 1.0, *) {
                self.listRowSpacing(spacing ?? 0)
            } else {
                self
            }
        #else
            self
        #endif
    }

    /// Sets the spacing between sections in a list.
    ///
    /// Example:
    /// ```swift
    /// List { ... }
    ///     .adaptiveListSectionSpacing(.compact)
    /// ```
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

    /// Configures the background prominence of the view within a list.
    @ViewBuilder
    public func adaptiveBackgroundProminence(_ prominence: AdaptiveBackgroundProminence)
        -> some View
    {
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

    /// Sets margins for list sections (iOS 26+).
    @ViewBuilder
    public func adaptiveListSectionMargins(_ edges: Edge.Set, _ length: CGFloat?) -> some View {
        #if os(iOS) || os(visionOS) || os(watchOS) || os(tvOS)
            if #available(iOS 26.0, tvOS 26.0, watchOS 26.0, visionOS 26.0, *) {
                self.listSectionMargins(edges, length)
            } else {
                self
            }
        #else
            self
        #endif
    }

    // MARK: - Badges

    /// Adds a numerical badge to a list item.
    @ViewBuilder
    public func adaptiveBadge(_ count: Int) -> some View {
        #if os(iOS) || os(macOS) || os(watchOS) || os(visionOS)
            if #available(iOS 15.0, macOS 12.0, watchOS 8.0, visionOS 1.0, *) {
                self.badge(count)
            } else {
                self
            }
        #else
            self
        #endif
    }

    /// Adds a string badge to a list item.
    @ViewBuilder
    public func adaptiveBadge(_ string: String) -> some View {
        #if os(iOS) || os(macOS) || os(watchOS) || os(visionOS)
            if #available(iOS 15.0, macOS 12.0, watchOS 8.0, visionOS 1.0, *) {
                self.badge(string)
            } else {
                self
            }
        #else
            self
        #endif
    }

    // MARK: - Interactions

    /// Adds swipe actions to a list row.
    ///
    /// Example:
    /// ```swift
    /// Text("Item")
    ///     .adaptiveSwipeActions(edge: .trailing) {
    ///         Button(role: .destructive) { ... } label: { Label("Delete", systemImage: "trash") }
    ///     }
    /// ```
    @ViewBuilder
    public func adaptiveSwipeActions<T: View>(
        edge: HorizontalEdge = .trailing, allowsFullSwipe: Bool = true,
        @ViewBuilder content: () -> T
    ) -> some View {
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

    /// Makes the list content refreshable.
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

    /// Disables moving rows in the list.
    @ViewBuilder
    public func adaptiveMoveDisabled(_ isDisabled: Bool) -> some View {
        if #available(iOS 13.0, macOS 10.15, tvOS 13.0, watchOS 6.0, visionOS 1.0, *) {
            self.moveDisabled(isDisabled)
        } else {
            self
        }
    }

    /// Disables deleting rows in the list.
    @ViewBuilder
    public func adaptiveDeleteDisabled(_ isDisabled: Bool) -> some View {
        if #available(iOS 13.0, macOS 10.15, tvOS 13.0, watchOS 6.0, visionOS 1.0, *) {
            self.deleteDisabled(isDisabled)
        } else {
            self
        }
    }

    // MARK: - Prominence & Backgrounds

    /// Sets the prominence of badges in the list.
    @ViewBuilder
    public func adaptiveBadgeProminence(_ prominence: AdaptiveBadgeProminence) -> some View {
        #if os(iOS) || os(macOS) || os(watchOS) || os(tvOS) || os(visionOS)
            if #available(iOS 17.0, macOS 14.0, watchOS 10.0, tvOS 17.0, visionOS 1.0, *) {
                switch prominence {
                case .standard:
                    self.badgeProminence(.standard)
                case .increased:
                    self.badgeProminence(.increased)
                }
            } else {
                self
            }
        #else
            self
        #endif
    }

    /// Sets the prominence of headers in the list.
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

    /// Sets the tint color for the list item.
    @ViewBuilder
    public func adaptiveListItemTint(_ tint: Color?) -> some View {
        #if os(iOS) || os(macOS) || os(watchOS) || os(tvOS) || os(visionOS)
            if #available(iOS 14.0, macOS 11.0, watchOS 7.0, tvOS 14.0, visionOS 1.0, *) {
                if let tint {
                    self.listItemTint(tint)
                } else {
                    self.listItemTint(Optional<ListItemTint>.none)
                }
            } else {
                self
            }
        #else
            self
        #endif
    }

    /// Sets the background view for the list row.
    @ViewBuilder
    public func adaptiveListRowBackground<V: View>(_ view: V?) -> some View {
        if #available(iOS 13.0, macOS 10.15, watchOS 6.0, tvOS 13.0, visionOS 1.0, *) {
            self.listRowBackground(view)
        } else {
            self
        }
    }

    /// Sets custom insets for the list row.
    @ViewBuilder
    public func adaptiveListRowInsets(_ insets: EdgeInsets?) -> some View {
        if #available(iOS 13.0, macOS 10.15, watchOS 6.0, tvOS 13.0, visionOS 1.0, *) {
            self.listRowInsets(insets)
        } else {
            self
        }
    }

    // MARK: - Section Index (iOS 26)

    /// Sets the label for the section index (iOS 26+).
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

    /// Sets the visibility of the list section index (iOS 26+).
    @ViewBuilder
    public func adaptiveListSectionIndexVisibility(_ visibility: Visibility) -> some View {
        #if os(iOS) || os(watchOS) || os(tvOS) || os(visionOS)
            if #available(iOS 26.0, watchOS 26.0, tvOS 26.0, visionOS 26.0, *) {
                self.listSectionIndexVisibility(visibility)
            } else {
                self
            }
        #else
            self
        #endif
    }

    // MARK: - Environment Defaults

    /// Sets the default minimum height for list headers via the environment.
    @ViewBuilder
    public func adaptiveDefaultMinListHeaderHeight(_ height: CGFloat?) -> some View {
        if #available(iOS 13.0, macOS 10.15, watchOS 6.0, tvOS 13.0, visionOS 1.0, *) {
            self.environment(\.defaultMinListHeaderHeight, height)
        } else {
            self
        }
    }

    /// Sets the default minimum height for list rows via the environment.
    @ViewBuilder
    public func adaptiveDefaultMinListRowHeight(_ height: CGFloat?) -> some View {
        if #available(iOS 13.0, macOS 10.15, watchOS 6.0, tvOS 13.0, visionOS 1.0, *) {
            self.environment(\.defaultMinListRowHeight, height ?? 0)
        } else {
            self
        }
    }
}
