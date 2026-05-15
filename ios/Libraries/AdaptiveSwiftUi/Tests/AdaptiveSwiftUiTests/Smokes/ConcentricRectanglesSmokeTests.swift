import SwiftUI
import XCTest
@testable import AdaptiveSwiftUi

final class ConcentricRectanglesSmokeTests: XCTestCase {
    @MainActor
    func testConcentricRectanglesContractsCompile() {
        _ = ConcentricRectanglesSmokeView()
    }
}

private struct ConcentricRectanglesSmokeView: View {
    var body: some View {
        AdaptiveConcentricRectangle(fallbackCornerRadius: 10)
            .fill(Color.blue)
            .frame(width: 100, height: 100)
    }
}
