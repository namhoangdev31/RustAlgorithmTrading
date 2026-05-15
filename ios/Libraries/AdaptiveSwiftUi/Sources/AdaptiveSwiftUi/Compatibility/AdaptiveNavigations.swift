import SwiftUI

extension View {

    /// Configures the view's adaptive title and subtitle for navigation.
    ///
    /// This modifier handles cross-platform navigation headers:
    /// - **iOS 26+ / macOS 11+**: Uses native `.navigationTitle` and `.navigationSubtitle`.
    /// - **iOS 14-18**: Polyfills the subtitle by using a `ToolbarItem` with `.principal` placement,
    ///   stacking the title and subtitle vertically.
    /// - **iOS 13**: Falls back to showing only the main title.
    ///
    /// - Parameters:
    ///   - title: The primary title to display.
    ///   - subtitle: The secondary title/subtitle to display.
    ///
    /// Example:
    /// ```swift
    /// View()
    ///     .adaptiveNavigationTitle("Settings", subtitle: "Profile and Security")
    /// ```
    @ViewBuilder
    public func adaptiveNavigationTitle(_ title: LocalizedStringKey, subtitle: LocalizedStringKey)
        -> some View
    {
        if #available(iOS 26.0, macOS 11.0, *) {
            self.navigationTitle(title).navigationSubtitle(subtitle)
        } else {
            fallbackTitle(titleKey: title, subtitleKey: subtitle)
        }
    }

    /// Configures the view's adaptive title and subtitle using string protocols.
    @ViewBuilder
    public func adaptiveNavigationTitle<S: StringProtocol>(_ title: S, subtitle: S) -> some View {
        if #available(iOS 26.0, macOS 11.0, *) {
            self.navigationTitle(title).navigationSubtitle(subtitle)
        } else {
            fallbackTitle(title: title, subtitle: subtitle)
        }
    }

    @ViewBuilder
    private func fallbackTitle(titleKey: LocalizedStringKey, subtitleKey: LocalizedStringKey)
        -> some View
    {
        if #available(iOS 14.0, macOS 11.0, tvOS 14.0, watchOS 7.0, *) {
            self.navigationTitle(titleKey)
                .toolbar {
                    ToolbarItem(placement: .principal) {
                        VStack(spacing: 0) {
                            Text(titleKey)
                                .font(.headline)
                            Text(subtitleKey)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
        } else {
            #if os(iOS) || os(tvOS) || os(watchOS)
                self.navigationBarTitle(Text(titleKey))
            #else
                self
            #endif
        }
    }

    @ViewBuilder
    private func fallbackTitle<S: StringProtocol>(title: S, subtitle: S) -> some View {
        if #available(iOS 14.0, macOS 11.0, tvOS 14.0, watchOS 7.0, *) {
            self.navigationTitle(title)
                .toolbar {
                    ToolbarItem(placement: .principal) {
                        VStack(spacing: 0) {
                            Text(title)
                                .font(.headline)
                            Text(subtitle)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
        } else {
            #if os(iOS) || os(tvOS) || os(watchOS)
                self.navigationBarTitle(Text(title))
            #else
                self
            #endif
        }
    }

    // MARK: - Container Background

    /// Applies a background style to the navigation container on supported platforms.
    ///
    /// Supported on iOS 18+ and watchOS 11+.
    ///
    /// Example:
    /// ```swift
    /// NavigationStack { ... }
    ///     .adaptiveContainerBackground(.ultraThinMaterial)
    /// ```
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

    /// Applies a custom view as the background to the navigation container.
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

    // MARK: - Scroll Edge Effect

    /// Enables a hard edge effect when scrolling to the edge of the navigation container.
    ///
    /// Supported on iOS 26+, macOS 26+, etc.
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
