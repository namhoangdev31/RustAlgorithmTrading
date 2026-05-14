import Foundation
import Testing

@Test("RSS_CASE_VALIDATE (1 item = 1 test case)", arguments: ExploreSwiftUIRSSParameterizedData.caseArguments)
func rssCaseValidity(_ item: ExploreSwiftUIRSSItem) {
    #expect(item.hasRequiredCoreFields)
    #expect(!item.component.isEmpty)
    #expect(ExploreSwiftUIRSSParameterizedData.knownComponents.contains(item.component))
}

@Test("RSS_COMPONENT_VALIDATE (1 component = 1 test case)", arguments: ExploreSwiftUIRSSParameterizedData.componentExpectations)
func rssComponentCoverage(_ expectation: RSSComponentExpectation) {
    let actualCount = ExploreSwiftUIRSSParameterizedData.feed.items.filter { $0.component == expectation.component }.count
    #expect(actualCount == expectation.expectedCount)
}

private enum ExploreSwiftUIRSSParameterizedData {
    static let feed: ExploreSwiftUIRSSFeed = {
        do {
            let data = try loadExploreSwiftUIRSSFixtureData()
            return try ExploreSwiftUIRSSParser.parse(data: data)
        } catch {
            fatalError("Failed to load ExploreSwiftUI RSS fixture: \(error)")
        }
    }()

    static let caseArguments: [ExploreSwiftUIRSSItem] = feed.items

    static let componentExpectations: [RSSComponentExpectation] = [
        .init(component: "button", expectedCount: 11),
        .init(component: "color", expectedCount: 10),
        .init(component: "concentricrectangle", expectedCount: 2),
        .init(component: "contentunavailableview", expectedCount: 3),
        .init(component: "controlgroup", expectedCount: 5),
        .init(component: "datepicker", expectedCount: 11),
        .init(component: "divider", expectedCount: 4),
        .init(component: "gauge", expectedCount: 11),
        .init(component: "glasseffectcontainer", expectedCount: 1),
        .init(component: "groupbox", expectedCount: 3),
        .init(component: "label", expectedCount: 4),
        .init(component: "labeledcontent", expectedCount: 3),
        .init(component: "link", expectedCount: 5),
        .init(component: "list", expectedCount: 32),
        .init(component: "material", expectedCount: 1),
        .init(component: "menu", expectedCount: 8),
        .init(component: "navigation", expectedCount: 1),
        .init(component: "picker", expectedCount: 14),
        .init(component: "progressview", expectedCount: 4),
        .init(component: "scrollview", expectedCount: 1),
        .init(component: "shapes", expectedCount: 1),
        .init(component: "sheet", expectedCount: 11),
        .init(component: "slider", expectedCount: 6),
        .init(component: "tabview", expectedCount: 21),
        .init(component: "text", expectedCount: 1),
        .init(component: "toolbars", expectedCount: 3),
        .init(component: "view", expectedCount: 5),
        .init(component: "viewthatfits", expectedCount: 2)
    ]

    static let knownComponents = Set(componentExpectations.map(\.component))
}

struct RSSComponentExpectation: Sendable, CustomStringConvertible {
    let component: String
    let expectedCount: Int

    var description: String { "\(component):\(expectedCount)" }
}
