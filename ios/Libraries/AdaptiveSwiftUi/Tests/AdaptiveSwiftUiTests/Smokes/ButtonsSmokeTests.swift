import SwiftUI
import XCTest
@testable import AdaptiveSwiftUi

final class ButtonsSmokeTests: XCTestCase {
    @MainActor
    func testButtonsContractsCompile() {
        _ = ButtonsSmokeView()
    }
}

private struct ButtonsSmokeView: View {
    var body: some View {
        VStack {
            AdaptiveButton("Fitted") {}
                .adaptiveButtonStyle(.borderedProminent)
                .adaptiveButtonSizing(.fitted)
            
            AdaptiveButton("Flexible") {}
                .adaptiveButtonStyle(.glass)
                .adaptiveButtonSizing(.flexible)
            
            AdaptiveButton("Cancel", role: .cancel) {}
                .adaptiveButtonBorderShape(.capsule)
            
            AdaptiveButton("Close", systemImage: "xmark", role: .close) {}
                .adaptiveButtonTint(.red)
            
            AdaptiveRoleButton(role: .confirm) {}
            AdaptiveRenameButton { }
            AdaptivePasteButton { _ in }
            AdaptiveEditButton()
        }
    }
}
