import SwiftUI

public struct AdaptiveScrollView<Content: View>: View {
    private let axes: Axis.Set
    private let showsIndicators: Bool
    private let content: () -> Content

    /// Creates a generic adaptive scroll view wrapping the native ScrollView.
    public init(
        _ axes: Axis.Set = .vertical,
        showsIndicators: Bool = true,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.axes = axes
        self.showsIndicators = showsIndicators
        self.content = content
    }

    public var body: some View {
        ScrollView(axes, showsIndicators: showsIndicators) {
            content()
        }
    }
}
