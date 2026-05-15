import SwiftUI
import XCTest
@testable import AdaptiveSwiftUi

final class ScrollViewsSmokeTests: XCTestCase {
    @MainActor
    func testScrollViewsContractsCompile() {
        _ = ScrollViewsSmokeView()
    }
}

private struct ScrollViewsSmokeView: View {
    var body: some View {
        AdaptiveScrollView {
            VStack {
                Text("A")
                Text("B")
            }
        }
        .adaptiveScrollEdgeEffectStyle(.hard, for: .vertical)
    }
}
