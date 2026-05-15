import SwiftUI
import XCTest
@testable import AdaptiveSwiftUi

final class ContentUnavailableViewsSmokeTests: XCTestCase {
    @MainActor
    func testContentUnavailableViewsContractsCompile() {
        _ = ContentUnavailableViewsSmokeView()
    }
}

private struct ContentUnavailableViewsSmokeView: View {
    var body: some View {
        VStack {
            AdaptiveContentUnavailableView("No Results", systemImage: "magnifyingglass")
            AdaptiveContentUnavailableView.search(text: "Antigravity")
            AdaptiveContentUnavailableView("Empty", systemImage: "tray") {
                Button("Retry") {}
            }
        }
    }
}
