import SwiftUI
import XCTest
@testable import AdaptiveSwiftUi

final class MaterialSmokeTests: XCTestCase {
    @MainActor
    func testMaterialContractsCompile() {
        _ = MaterialSmokeView()
    }
}

private struct MaterialSmokeView: View {
    var body: some View {
        VStack {
            Text("Background")
                .adaptiveMaterialBackground(.thin, cornerRadius: 10)
        }
    }
}
