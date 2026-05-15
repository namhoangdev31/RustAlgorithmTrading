import SwiftUI
import XCTest
@testable import AdaptiveSwiftUi

final class TextSmokeTests: XCTestCase {
    @MainActor
    func testTextContractsCompile() {
        _ = TextSmokeView()
    }
}

private struct TextSmokeView: View {
    var body: some View {
        VStack {
            AdaptiveFormattedText(1234.56, format: .currency(code: "USD"))
            AdaptiveFormattedText(0.42, format: .percent)
        }
    }
}
