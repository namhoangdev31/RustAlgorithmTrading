import SwiftUI

private struct ScrollOffsetPreferenceKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = nextValue()
    }
}

extension View {
    func onCompatScrollOffsetChange(in coordinateSpace: String = "scroll", perform: @escaping (CGFloat) -> Void) -> some View {
        self
            .background(
                GeometryReader { proxy in
                    Color.clear
                        .preference(key: ScrollOffsetPreferenceKey.self, value: -proxy.frame(in: .named(coordinateSpace)).origin.y)
                }
            )
            .onPreferenceChange(ScrollOffsetPreferenceKey.self, perform: perform)
    }
}
