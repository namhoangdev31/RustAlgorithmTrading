import SwiftUI
import XCTest
@testable import AdaptiveSwiftUi

final class ShapesSmokeTests: XCTestCase {
    @MainActor
    func testShapesContractsCompile() {
        _ = ShapesSmokeView()
    }
}

private struct ShapesSmokeView: View {
    var body: some View {
        AdaptiveShape()
            .adaptiveShapeTint(.blue)
    }
}
