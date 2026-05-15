import SwiftUI
import XCTest
@testable import AdaptiveSwiftUi

final class ProgressViewsSmokeTests: XCTestCase {
    @MainActor
    func testProgressViewsContractsCompile() {
        _ = ProgressViewsSmokeView()
    }
}

private struct ProgressViewsSmokeView: View {
    var body: some View {
        VStack {
            AdaptiveProgressView(value: 0.5) {
                Text("Linear")
            }
            .adaptiveProgressViewStyle(.linear)
            .adaptiveProgressViewTint(.green)
            
            AdaptiveProgressView {
                Text("Circular")
            }
            .adaptiveProgressViewStyle(.circular)
        }
    }
}
