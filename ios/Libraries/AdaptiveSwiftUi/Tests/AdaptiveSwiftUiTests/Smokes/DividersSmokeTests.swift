import SwiftUI
import XCTest
@testable import AdaptiveSwiftUi

final class DividersSmokeTests: XCTestCase {
    @MainActor
    func testDividersContractsCompile() {
        _ = DividersSmokeView()
    }
}

private struct DividersSmokeView: View {
    var body: some View {
        VStack {
            AdaptiveDivider()
                .adaptiveDividerTint(.red)
            
            HStack {
                Text("Left")
                AdaptiveDivider()
                Text("Right")
            }
        }
    }
}
