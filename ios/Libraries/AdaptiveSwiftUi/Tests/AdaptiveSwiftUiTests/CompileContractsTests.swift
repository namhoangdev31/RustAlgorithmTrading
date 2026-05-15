import Foundation
import SwiftUI
import XCTest

@testable import AdaptiveSwiftUi

final class CompileContractsTests: XCTestCase {
    func testOSGenerationOrdering() {
        XCTAssertTrue(AdaptiveOSGeneration.v26.rawValue > AdaptiveOSGeneration.v18.rawValue)
        XCTAssertTrue(AdaptiveOSGeneration.v18.rawValue > AdaptiveOSGeneration.v15.rawValue)
    }

    func testPlatformCapabilityFlagsEvaluate() {
        _ = AdaptivePlatformVersion.supportsWWDC25Design
        _ = AdaptivePlatformVersion.supportsTabContentAPI
        _ = AdaptivePlatformVersion.supportsAdaptableTabCustomization
        _ = AdaptivePlatformVersion.supportsAdvancedSheetPresentation
        _ = AdaptivePlatformVersion.supportsAdvancedListAPI
        _ = AdaptivePlatformVersion.supportsAdvancedPickerAPI
    }

    func testExploreSwiftUIRSSFixtureHasFullCoverage() throws {
        let xmlData = try loadExploreSwiftUIRSSFixtureData()
        let feed = try ExploreSwiftUIRSSParser.parse(data: xmlData)

        XCTAssertEqual(feed.lastBuildDate, "Sat, 18 Apr 2026 11:27:46 GMT")
        XCTAssertEqual(feed.items.count, 184, "RSS must include all published cases from snapshot.")
        XCTAssertTrue(
            feed.items.allSatisfy(\.hasRequiredCoreFields),
            "Every RSS case must contain core fields: title/link/guid/pubDate/content."
        )
        XCTAssertEqual(
            feed.items.filter { !$0.summary.isEmpty }.count,
            181,
            "Snapshot currently has 181 item descriptions and 3 empty descriptions."
        )
        XCTAssertEqual(
            Set(feed.items.map(\.guid)).count, 184, "Each RSS case must have a unique guid.")

        let componentCounts = Dictionary(grouping: feed.items, by: \.component).mapValues(\.count)
        let expectedComponentCounts: [String: Int] = [
            "button": 11,
            "color": 10,
            "concentricrectangle": 2,
            "contentunavailableview": 3,
            "controlgroup": 5,
            "datepicker": 11,
            "divider": 4,
            "gauge": 11,
            "glasseffectcontainer": 1,
            "groupbox": 3,
            "label": 4,
            "labeledcontent": 3,
            "link": 5,
            "list": 32,
            "material": 1,
            "menu": 8,
            "navigation": 1,
            "picker": 14,
            "progressview": 4,
            "scrollview": 1,
            "shapes": 1,
            "sheet": 11,
            "slider": 6,
            "tabview": 21,
            "text": 1,
            "toolbars": 3,
            "view": 5,
            "viewthatfits": 2,
        ]

        XCTAssertEqual(
            componentCounts, expectedComponentCounts,
            "Component coverage differs from RSS snapshot.")
        XCTAssertEqual(componentCounts.count, 28, "RSS must contain all expected components.")
    }
}

// MARK: - RSS Parser Infrastructure

struct ExploreSwiftUIRSSFeed: Sendable {
    let lastBuildDate: String
    let items: [ExploreSwiftUIRSSItem]
}

struct ExploreSwiftUIRSSItem: Hashable, Sendable, CustomStringConvertible {
    let title: String
    let link: String
    let guid: String
    let pubDate: String
    let summary: String
    let contentEncoded: String

    var component: String {
        let marker = "/library/"
        guard let markerRange = link.range(of: marker) else {
            return ""
        }

        let pathAfterMarker = link[markerRange.upperBound...]
        return pathAfterMarker.split(separator: "/").first.map(String.init) ?? ""
    }

    var hasRequiredCoreFields: Bool {
        [title, link, guid, pubDate, contentEncoded].allSatisfy { !$0.isEmpty }
    }

    var description: String {
        "\(guid) [\(component)]"
    }
}

final class ExploreSwiftUIRSSParser: NSObject, XMLParserDelegate {
    private var lastBuildDate = ""
    private var items: [ExploreSwiftUIRSSItem] = []
    private var currentItem = MutableItem()
    private var isInsideItem = false
    private var currentTextValue = ""

    static func parse(data: Data) throws -> ExploreSwiftUIRSSFeed {
        let delegate = ExploreSwiftUIRSSParser()
        let parser = XMLParser(data: data)
        parser.delegate = delegate
        parser.shouldProcessNamespaces = true

        guard parser.parse() else {
            throw parser.parserError ?? NSError(domain: "AdaptiveSwiftUiTests", code: 2)
        }

        return ExploreSwiftUIRSSFeed(
            lastBuildDate: delegate.lastBuildDate,
            items: delegate.items
        )
    }

    func parser(
        _ parser: XMLParser,
        didStartElement elementName: String,
        namespaceURI: String?,
        qualifiedName qName: String?,
        attributes attributeDict: [String: String] = [:]
    ) {
        let currentElementName = normalizedName(
            elementName: elementName,
            namespaceURI: namespaceURI,
            qualifiedName: qName
        )
        currentTextValue = ""

        if currentElementName == "item" {
            isInsideItem = true
            currentItem = MutableItem()
        }
    }

    func parser(_ parser: XMLParser, foundCharacters string: String) {
        currentTextValue += string
    }

    func parser(
        _ parser: XMLParser,
        didEndElement elementName: String,
        namespaceURI: String?,
        qualifiedName qName: String?
    ) {
        let endedElementName = normalizedName(
            elementName: elementName,
            namespaceURI: namespaceURI,
            qualifiedName: qName
        )
        let normalizedValue = currentTextValue.trimmingCharacters(in: .whitespacesAndNewlines)

        if isInsideItem {
            switch endedElementName {
            case "title":
                currentItem.title = normalizedValue
            case "link":
                currentItem.link = normalizedValue
            case "guid":
                currentItem.guid = normalizedValue
            case "pubDate":
                currentItem.pubDate = normalizedValue
            case "description":
                currentItem.summary = normalizedValue
            case "content:encoded":
                currentItem.contentEncoded = normalizedValue
            case "item":
                items.append(currentItem.finalize())
                currentItem = MutableItem()
                isInsideItem = false
            default:
                break
            }
        } else if endedElementName == "lastBuildDate" {
            lastBuildDate = normalizedValue
        }

        currentTextValue = ""
    }

    private func normalizedName(
        elementName: String,
        namespaceURI: String?,
        qualifiedName: String?
    ) -> String {
        if let qualifiedName {
            return qualifiedName
        }

        if namespaceURI == "http://purl.org/rss/1.0/modules/content/", elementName == "encoded" {
            return "content:encoded"
        }

        return elementName
    }
}

func loadExploreSwiftUIRSSFixtureData() throws -> Data {
    let fixtureURL =
        Bundle.module.url(
            forResource: "exploreswiftui_feed",
            withExtension: "xml",
            subdirectory: "Fixtures"
        )
        ?? Bundle.module.url(
            forResource: "exploreswiftui_feed",
            withExtension: "xml"
        )

    guard let fixtureURL else {
        throw NSError(domain: "AdaptiveSwiftUiTests", code: 1)
    }

    return try Data(contentsOf: fixtureURL)
}

private struct MutableItem {
    var title = ""
    var link = ""
    var guid = ""
    var pubDate = ""
    var summary = ""
    var contentEncoded = ""

    func finalize() -> ExploreSwiftUIRSSItem {
        ExploreSwiftUIRSSItem(
            title: title,
            link: link,
            guid: guid,
            pubDate: pubDate,
            summary: summary,
            contentEncoded: contentEncoded
        )
    }
}
