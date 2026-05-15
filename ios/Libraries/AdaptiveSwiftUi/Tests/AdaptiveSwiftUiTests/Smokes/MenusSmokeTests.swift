import SwiftUI
import XCTest
@testable import AdaptiveSwiftUi

final class MenusSmokeTests: XCTestCase {
    @MainActor
    func testMenusContractsCompile() {
        _ = MenusSmokeView()
    }
}

private struct MenusSmokeView: View {
    var body: some View {
        VStack {
            AdaptiveMenuActionButton {
                Button("1") {}
                Section("2") {
                    Button("Nested") {}
                }
                Divider()
                Button("3") {}
            } label: {
                Text("Menu")
            } primaryAction: {
                print("Primary")
            }
            .adaptiveMenuOrder(.fixed)
            
            Text("Context")
                .adaptiveContextMenu {
                    Button("Edit") {}
                } preview: {
                    Text("Preview")
                }
        }
    }
}
