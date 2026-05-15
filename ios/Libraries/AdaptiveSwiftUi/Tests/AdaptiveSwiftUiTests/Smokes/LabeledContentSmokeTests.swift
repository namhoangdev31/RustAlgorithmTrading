import SwiftUI
import XCTest
@testable import AdaptiveSwiftUi

final class LabeledContentSmokeTests: XCTestCase {
    @MainActor
    func testLabeledContentContractsCompile() {
        _ = LabeledContentSmokeView()
    }
}

private struct LabeledContentSmokeView: View {
    var body: some View {
        VStack {
            AdaptiveLabeledContent("Label") {
                Text("Content")
            }
            AdaptiveLabeledContent("Price") {
                AdaptiveFormattedText(100, format: .currency(code: "USD"))
            }
        }
    }
}
