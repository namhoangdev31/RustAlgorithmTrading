import SwiftUI
import XCTest
@testable import AdaptiveSwiftUi

final class SheetsSmokeTests: XCTestCase {
    @MainActor
    func testSheetsContractsCompile() {
        _ = SheetsSmokeView()
    }
}

private struct SheetsSmokeView: View {
    @State private var presented = false
    var body: some View {
        Button("Sheet") { presented = true }
            .sheet(isPresented: $presented) {
                Text("Content")
                    .adaptivePresentationDetents([.medium, .large])
                    .adaptivePresentationSizing(.form)
                    .adaptiveInteractiveDismissDisabled(true)
                    .adaptivePresentationBackground(.ultraThinMaterial)
                    .adaptivePresentationCornerRadius(20)
                    .adaptivePresentationDragIndicator(.visible)
            }
    }
}
