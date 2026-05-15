import SwiftUI
import XCTest
@testable import AdaptiveSwiftUi

final class ToolbarsSmokeTests: XCTestCase {
    @MainActor
    func testToolbarsContractsCompile() {
        _ = ToolbarsSmokeView()
    }
}

private struct ToolbarsSmokeView: View {
    var body: some View {
        NavigationStack {
            Text("Content")
                .toolbar {
                    ToolbarItem(placement: .adaptive(.title)) { Text("Title") }
                    ToolbarItem(placement: .adaptive(.subtitle)) { Text("Subtitle") }
                    ToolbarItem(placement: .adaptive(.largeTitle)) { Text("Large Title") }
                    ToolbarItem(placement: .adaptive(.largeSubtitle)) { Text("Large Subtitle") }
                    
                    AdaptiveToolbarSpacer(.fixed, width: 20)
                    AdaptiveToolbarSpacer(.flexible)
                    
                    ToolbarItem(placement: .primaryAction) {
                        Button("Action") {}
                            .adaptiveSharedBackgroundVisibility(.visible)
                    }
                }
        }
    }
}
