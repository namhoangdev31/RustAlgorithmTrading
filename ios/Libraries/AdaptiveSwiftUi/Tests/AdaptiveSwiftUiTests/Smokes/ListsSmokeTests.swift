import SwiftUI
import XCTest
@testable import AdaptiveSwiftUi

final class ListsSmokeTests: XCTestCase {
    @MainActor
    func testListsContractsCompile() {
        _ = ListsSmokeView()
    }
}

private struct ListsSmokeView: View {
    struct Item: Identifiable {
        let id = UUID()
        let name: String
        let children: [Item]?
    }
    
    var body: some View {
        List {
            Section("Group") {
                Text("Row")
                    .adaptiveListRowSeparator(.hidden)
                    .adaptiveListRowBackground(Color.blue.opacity(0.1))
                    .adaptiveSwipeActions { Button("Swipe") {} }
                    .adaptiveBadge(1)
            }
            .adaptiveSectionIndexLabel("S")
            .adaptiveListSectionSeparator(.visible)
            
            AdaptiveDisclosureGroup("Disclosure") {
                Text("Nested")
            }
            
            AdaptiveOutlineGroup([Item(name: "A", children: nil)], children: \.children) { item in
                Text(item.name)
            }
        }
        .adaptiveListStyle(.insetGrouped)
        .adaptiveListRowSpacing(4)
        .adaptiveListSectionSpacing(.compact)
        .adaptiveRefreshable { }
        .adaptiveListSectionIndexVisibility(.visible)
    }
}
