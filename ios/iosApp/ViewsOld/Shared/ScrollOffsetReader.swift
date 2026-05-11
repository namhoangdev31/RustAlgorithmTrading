import SwiftUI

// MARK: - Scroll Offset PreferenceKey
// iOS 16/17/18 compatible scroll offset tracking.
// Usage: add .readScrollOffset(into: $offsetY) to ScrollView.
struct ScrollOffsetPreferenceKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = nextValue()
    }
}

extension View {
    /// Track scroll Y offset from a ScrollView on iOS 16/17/18.
    func readScrollOffset(into binding: Binding<CGFloat>) -> some View {
        self.background(
            GeometryReader { geo in
                Color.clear
                    .preference(
                        key: ScrollOffsetPreferenceKey.self,
                        value: -geo.frame(in: .named("scrollCoordSpace")).minY
                    )
            }
        )
        .onPreferenceChange(ScrollOffsetPreferenceKey.self) { value in
            binding.wrappedValue = value
        }
    }
}
