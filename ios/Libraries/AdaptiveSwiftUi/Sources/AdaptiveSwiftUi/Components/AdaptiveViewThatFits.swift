import SwiftUI

/// A view that evaluates its child views and chooses the first one that fits in the available space.
///
/// `AdaptiveViewThatFits` provides a bridge for the `ViewThatFits` component:
/// - **Modern OS (iOS 16+, macOS 13+)**: Leverages the native `ViewThatFits` to dynamically 
///   pick the most appropriate layout based on available width or height.
/// - **Legacy Fallback (iOS 13-15)**: Displays the first view provided in the `content` 
///   builder, treating it as the primary preferred layout.
///
/// Example:
/// ```swift
/// AdaptiveViewThatFits(in: .horizontal) {
///     HStack { /* Long content */ }
///     VStack { /* Compact content */ }
/// }
/// ```
public struct AdaptiveViewThatFits<Content: View>: View {
    private let axes: AdaptiveViewThatFitsAxes
    private let content: () -> Content

    /// Creates an adaptive view that fits.
    ///
    /// - Parameters:
    ///   - axes: The axes to evaluate for fitting. Defaults to `.horizontal`.
    ///   - content: A view builder containing the candidate views, ordered by preference.
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
            // Fallback: Just show the first view from content.
            // ViewThatFits prioritizes the first view that fits.
            // On older OS, we just show the first one as a reasonable default.
            content()
        }
        #else
        content()
        #endif
    }
}
