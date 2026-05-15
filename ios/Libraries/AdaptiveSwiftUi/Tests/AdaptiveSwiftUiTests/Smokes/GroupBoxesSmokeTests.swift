import SwiftUI
import XCTest
@testable import AdaptiveSwiftUi

final class GroupBoxesSmokeTests: XCTestCase {
    @MainActor
    func testGroupBoxesContractsCompile() {
        _ = GroupBoxesSmokeView()
    }
}

private struct GroupBoxesSmokeView: View {
    var body: some View {
        VStack {
            AdaptiveGroupBox("Label") {
                Text("Content")
            }
            .adaptiveGroupBoxStyle(.automatic)
            .adaptiveGroupBoxBackgroundStyle(.thinMaterial)
        }
    }
}
