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
                .fill(AdaptiveColor.systemBlue)
                .frame(width: 50, height: 50)
            
            Text("Hi")
                .adaptiveForegroundStyle(.blue, variant: .secondary)
        }
    }
}
