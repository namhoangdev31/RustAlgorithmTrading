import SwiftUI
import XCTest
@testable import AdaptiveSwiftUi

final class ViewThatFitsSmokeTests: XCTestCase {
    @MainActor
    func testViewThatFitsContractsCompile() {
        _ = ViewThatFitsSmokeView()
    }
}

private struct ViewThatFitsSmokeView: View {
    var body: some View {
        AdaptiveViewThatFits(axes: .horizontal) {
            Text("A very long text that may not fit in the current space")
            Text("A shorter text")
            Text("Fit")
        }
    }
}
