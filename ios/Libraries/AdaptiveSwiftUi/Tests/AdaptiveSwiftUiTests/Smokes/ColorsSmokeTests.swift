import SwiftUI
import XCTest

@testable import AdaptiveSwiftUi

final class ColorsSmokeTests: XCTestCase {
    @MainActor
    func testColorsContractsCompile() {
        _ = ColorsSmokeView()
    }
}

private struct ColorsSmokeView: View {
    var body: some View {
        VStack {
            Rectangle()
                .fill(AdaptiveColor.systemFill)
                .frame(width: 50, height: 50)

            Text("Primary")
                .adaptiveForegroundStyle(.blue, hierarchy: .primary)
            
            Text("Secondary Gradient")
                .adaptiveForegroundStyle(.blue, gradient: true, hierarchy: .secondary)
            
            Text("Tertiary")
                .adaptiveForegroundStyle(.orange, hierarchy: .tertiary, opacity: 0.8)
            
            Text("Quaternary")
                .adaptiveForegroundStyle(.green, hierarchy: .quaternary)
        }
    }
}
