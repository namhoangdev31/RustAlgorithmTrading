import SwiftUI
import XCTest
@testable import AdaptiveSwiftUi

final class ControlGroupsSmokeTests: XCTestCase {
    @MainActor
    func testControlGroupsContractsCompile() {
        _ = ControlGroupsSmokeView()
    }
}

private struct ControlGroupsSmokeView: View {
    var body: some View {
        VStack {
            AdaptiveControlGroup {
                Button("1") {}
                Button("2") {}
            }
            .adaptiveControlGroupStyle(.navigation)
            
            AdaptiveControlGroup("Palette", systemImage: "paintpalette") {
                Button("Red") {}
            }
            .adaptiveControlGroupStyle(.palette)
        }
    }
}
