import SwiftUI
import XCTest
@testable import AdaptiveSwiftUi

final class ViewsSmokeTests: XCTestCase {
    @MainActor
    func testViewsContractsCompile() {
        _ = ViewsSmokeView()
    }
}

private struct ViewsSmokeView: View {
    var body: some View {
        Text("Surface")
            .adaptiveControlSize(.mini)
            .adaptiveContainerBackground(.thinMaterial, for: .navigation)
            .adaptiveBackgroundExtensionEffect()
            .adaptiveGlassEffect()
    }
}
