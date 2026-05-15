import SwiftUI
import XCTest
@testable import AdaptiveSwiftUi

final class TabViewsSmokeTests: XCTestCase {
    @MainActor
    func testTabViewsContractsCompile() {
        _ = TabViewsSmokeView()
    }
}

private struct TabViewsSmokeView: View {
    @State private var selection = "1"
    var body: some View {
        if #available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *) {
            TabView(selection: $selection) {
                AdaptiveValueTab("Home", systemImage: "house", value: "1") {
                    Text("Home")
                }
                
                AdaptiveTabSection("More") {
                    AdaptiveValueTab("Search", systemImage: "magnifyingglass", value: "2", role: .search) {
                        Text("Search")
                    }
                }
            }
            .adaptiveTabViewStyle(.sidebarAdaptable)
            .adaptiveTabViewSidebarHeader { Text("Head") }
            .adaptiveTabViewSidebarFooter { Text("Foot") }
            .adaptiveTabViewSidebarBottomBar { Text("Bottom") }
            .adaptiveTabViewBottomAccessory { Text("Accessory") }
            .adaptiveTabBarMinimizeBehavior(.onScroll)
        } else {
            TabView {
                Text("Fallback")
            }
        }
    }
}
