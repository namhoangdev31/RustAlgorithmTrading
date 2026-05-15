import SwiftUI
import XCTest

@testable import AdaptiveSwiftUi

final class ToolbarsSmokeTests: XCTestCase {
    @MainActor
    func testToolbarsContractsCompile() {
        if #available(iOS 16.0, macOS 13.0, tvOS 16.0, watchOS 9.0, visionOS 1.0, *) {
            _ = ToolbarsSmokeView()
        }
    }
}

@available(iOS 16.0, macOS 13.0, tvOS 16.0, watchOS 9.0, visionOS 1.0, *)
private struct ToolbarsSmokeView: View {
    var body: some View {
        NavigationStack {
            VStack {
                Text("Smoke Test Content")
            }
            #if !os(tvOS) && !os(watchOS)
                .adaptiveNavigationSubtitle("Adaptive Subtitle")
            #endif
            .toolbar {
                ToolbarItem(placement: .adaptive(.title)) {
                    Text("Title")
                }
                
                AdaptiveToolbarSpacer(.flexible)
                
                ToolbarItem(placement: .adaptive(.subtitle)) {
                    Text("Sub")
                }

                ToolbarItemGroup {
                    Button("Action A") {}
                    Button("Action B") {}
                }
                
                AdaptiveToolbarSpacer(.fixed, fallbackLength: 12)
                
                #if !os(tvOS) && !os(watchOS)
                    ToolbarItem {
                        Button("Shared") {}
                    }
                    .adaptiveSharedBackgroundVisibility(.visible)
                #endif
            }
        }
    }
}
