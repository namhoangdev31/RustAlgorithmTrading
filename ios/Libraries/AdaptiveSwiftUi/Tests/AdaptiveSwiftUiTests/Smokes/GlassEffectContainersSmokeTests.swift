import SwiftUI
import XCTest
@testable import AdaptiveSwiftUi

final class GlassEffectContainersSmokeTests: XCTestCase {
    @MainActor
    func testGlassEffectContainersContractsCompile() {
        _ = GlassEffectContainersSmokeView()
    }
}

private struct GlassEffectContainersSmokeView: View {
    var body: some View {
        AdaptiveGlassEffectContainer {
            Text("Glass Content")
                .adaptiveGlass()
        }
    }
}
