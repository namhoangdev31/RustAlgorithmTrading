import SwiftUI

public struct AdaptiveViewThatFits<Content: View>: View {
    private let axes: AdaptiveViewThatFitsAxes
    private let content: () -> Content

    public init(
        in axes: AdaptiveViewThatFitsAxes = .horizontal,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.axes = axes
        self.content = content
    }

    public var body: some View {
        #if os(iOS) || os(macOS) || os(watchOS) || os(tvOS) || os(visionOS)
        if #available(iOS 16.0, macOS 13.0, watchOS 9.0, tvOS 16.0, visionOS 1.0, *) {
            ViewThatFits(in: axes.native) {
                content()
            }
        } else {
            // Fallback: Just show the first view from content
            // ViewThatFits prioritizes the first view that fits.
            // On older OS, we just show the first one as a reasonable default.
            content()
        }
        #else
        content()
        #endif
    }
}
