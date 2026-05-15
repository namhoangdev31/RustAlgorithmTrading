import SwiftUI
import XCTest
@testable import AdaptiveSwiftUi

final class NavigationSmokeTests: XCTestCase {
    @MainActor
    func testNavigationContractsCompile() {
        _ = NavigationSmokeView()
    }
}

private struct NavigationSmokeView: View {
    var body: some View {
        NavigationStack {
            Text("Nav")
                .adaptiveNavigationTitle("Title", subtitle: "Subtitle")
        }
    }
}
