import SwiftUI

public extension View {
    
    /// Configures the view's title and subtitle for purposes of navigation.
    /// - On macOS 11+, uses the native `.navigationTitle` and `.navigationSubtitle(_:)`.
    /// - On iOS 14+ and other platforms, falls back to overriding the principal toolbar item to display both.
    /// - On iOS 13, falls back to just displaying the title.
    @ViewBuilder
    func adaptiveNavigationTitle(_ title: LocalizedStringKey, subtitle: LocalizedStringKey) -> some View {
        if #available(iOS 26.0, macOS 11.0, *) {
            self.navigationTitle(title).navigationSubtitle(subtitle)
        } else {
            fallbackTitle(titleKey: title, subtitleKey: subtitle)
        }
    }
    
    @ViewBuilder
    func adaptiveNavigationTitle<S: StringProtocol>(_ title: S, subtitle: S) -> some View {
        if #available(iOS 26.0, macOS 11.0, *) {
            self.navigationTitle(title).navigationSubtitle(subtitle)
        } else {
            fallbackTitle(title: title, subtitle: subtitle)
        }
    }
    
    @ViewBuilder
    private func fallbackTitle(titleKey: LocalizedStringKey, subtitleKey: LocalizedStringKey) -> some View {
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

    // MARK: - Scroll Edge Effect

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
