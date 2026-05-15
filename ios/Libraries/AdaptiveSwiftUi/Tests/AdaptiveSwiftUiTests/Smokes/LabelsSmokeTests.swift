import SwiftUI
import XCTest
@testable import AdaptiveSwiftUi

final class LabelsSmokeTests: XCTestCase {
    @MainActor
    func testLabelsContractsCompile() {
        _ = LabelsSmokeView()
    }
}

private struct LabelsSmokeView: View {
    var body: some View {
        VStack {
            AdaptiveLabel("Star", systemImage: "star")
            AdaptiveLabel("Gear") { Image(systemName: "gear") }
        }
    }
}
