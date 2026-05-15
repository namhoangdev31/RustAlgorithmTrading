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
}
