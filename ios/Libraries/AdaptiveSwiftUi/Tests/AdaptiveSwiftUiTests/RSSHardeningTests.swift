import Foundation
import XCTest

final class RSSHardeningTests: XCTestCase {
    func testMalformedXMLThrowsParserError() {
        let xml = """
        <?xml version=\"1.0\" encoding=\"UTF-8\"?>
        <rss version=\"2.0\" xmlns:content=\"http://purl.org/rss/1.0/modules/content/\">
          <channel>
            <lastBuildDate>Sat, 18 Apr 2026 11:27:46 GMT</lastBuildDate>
            <item>
              <title>Broken</title>
              <link>https://exploreswiftui.com/library/button/button</link>
              <guid isPermaLink=\"false\">https://exploreswiftui.com/elements/999</guid>
              <pubDate>Sat, 18 Apr 2026 11:27:46 GMT</pubDate>
              <description>Missing closing tags
          </channel>
        </rss>
        """

        XCTAssertThrowsError(try ExploreSwiftUIRSSParser.parse(data: Data(xml.utf8)))
    }

    func testMissingContentEncodedMarksItemAsIncomplete() throws {
        let xml = """
        <?xml version=\"1.0\" encoding=\"UTF-8\"?>
        <rss version=\"2.0\" xmlns:content=\"http://purl.org/rss/1.0/modules/content/\">
          <channel>
            <lastBuildDate>Sat, 18 Apr 2026 11:27:46 GMT</lastBuildDate>
            <item>
              <title>No Encoded Content</title>
              <link>https://exploreswiftui.com/library/button/button</link>
              <guid isPermaLink=\"false\">https://exploreswiftui.com/elements/991</guid>
              <pubDate>Sat, 18 Apr 2026 11:27:46 GMT</pubDate>
              <description>Summary only</description>
            </item>
          </channel>
        </rss>
        """

        let feed = try ExploreSwiftUIRSSParser.parse(data: Data(xml.utf8))
        let item = try XCTUnwrap(feed.items.first)

        XCTAssertEqual(feed.items.count, 1)
        XCTAssertEqual(item.contentEncoded, "")
        XCTAssertFalse(item.hasRequiredCoreFields)
    }

    func testDuplicateGuidBehaviorIsDeterministic() throws {
        let xml = """
        <?xml version=\"1.0\" encoding=\"UTF-8\"?>
        <rss version=\"2.0\" xmlns:content=\"http://purl.org/rss/1.0/modules/content/\">
          <channel>
            <lastBuildDate>Sat, 18 Apr 2026 11:27:46 GMT</lastBuildDate>
            <item>
              <title>One</title>
              <link>https://exploreswiftui.com/library/button/button</link>
              <guid isPermaLink=\"false\">https://exploreswiftui.com/elements/777</guid>
              <pubDate>Sat, 18 Apr 2026 11:27:46 GMT</pubDate>
              <description>First</description>
              <content:encoded><![CDATA[<p>first</p>]]></content:encoded>
            </item>
            <item>
              <title>Two</title>
              <link>https://exploreswiftui.com/library/list/list-row-background</link>
              <guid isPermaLink=\"false\">https://exploreswiftui.com/elements/777</guid>
              <pubDate>Sat, 18 Apr 2026 11:27:46 GMT</pubDate>
              <description>Second</description>
              <content:encoded><![CDATA[<p>second</p>]]></content:encoded>
            </item>
          </channel>
        </rss>
        """

        let feed = try ExploreSwiftUIRSSParser.parse(data: Data(xml.utf8))
        let duplicateGUIDs = duplicateGUIDs(in: feed)

        XCTAssertEqual(feed.items.count, 2)
        XCTAssertEqual(Set(feed.items.map(\.guid)).count, 1)
        XCTAssertEqual(duplicateGUIDs, ["https://exploreswiftui.com/elements/777"])
    }

    func testInvalidGuidBehaviorIsDetected() throws {
        let xml = """
        <?xml version=\"1.0\" encoding=\"UTF-8\"?>
        <rss version=\"2.0\" xmlns:content=\"http://purl.org/rss/1.0/modules/content/\">
          <channel>
            <lastBuildDate>Sat, 18 Apr 2026 11:27:46 GMT</lastBuildDate>
            <item>
              <title>Valid GUID</title>
              <link>https://exploreswiftui.com/library/button/button</link>
              <guid isPermaLink=\"false\">https://exploreswiftui.com/elements/1000</guid>
              <pubDate>Sat, 18 Apr 2026 11:27:46 GMT</pubDate>
              <description>Valid</description>
              <content:encoded><![CDATA[<p>valid</p>]]></content:encoded>
            </item>
            <item>
              <title>Invalid GUID</title>
              <link>https://exploreswiftui.com/library/list/list-row-background</link>
              <guid isPermaLink=\"false\">guid-without-url-format</guid>
              <pubDate>Sat, 18 Apr 2026 11:27:46 GMT</pubDate>
              <description>Invalid</description>
              <content:encoded><![CDATA[<p>invalid</p>]]></content:encoded>
            </item>
          </channel>
        </rss>
        """

        let feed = try ExploreSwiftUIRSSParser.parse(data: Data(xml.utf8))
        let invalidItems = invalidGUIDItems(in: feed)

        XCTAssertEqual(feed.items.count, 2)
        XCTAssertEqual(invalidItems.count, 1)
        XCTAssertEqual(invalidItems.first?.title, "Invalid GUID")
    }

    func testSnapshotInvariantLastBuildDateUniqueGuidCountAndComponentDistribution() throws {
        let xmlData = try loadExploreSwiftUIRSSFixtureData()
        let feed = try ExploreSwiftUIRSSParser.parse(data: xmlData)

        XCTAssertEqual(feed.lastBuildDate, "Sat, 18 Apr 2026 11:27:46 GMT")
        XCTAssertEqual(feed.items.count, 184)
        XCTAssertEqual(Set(feed.items.map(\.guid)).count, 184)

        let componentCounts = Dictionary(grouping: feed.items, by: \.component).mapValues(\.count)
        XCTAssertEqual(componentCounts["list"], 32)
        XCTAssertEqual(componentCounts["tabview"], 21)
        XCTAssertEqual(componentCounts["picker"], 14)
        XCTAssertEqual(componentCounts.count, 28)
    }

    func testRSSParsePerformanceP95Under150Milliseconds() throws {
        let xmlData = try loadExploreSwiftUIRSSFixtureData()
        let warmupRuns = 5
        let measuredRuns = 40

        for _ in 0 ..< warmupRuns {
            _ = try ExploreSwiftUIRSSParser.parse(data: xmlData)
        }

        let clock = ContinuousClock()
        var samplesMs: [Double] = []
        samplesMs.reserveCapacity(measuredRuns)

        for _ in 0 ..< measuredRuns {
            let duration = try clock.measure {
                _ = try ExploreSwiftUIRSSParser.parse(data: xmlData)
            }
            samplesMs.append(milliseconds(from: duration))
        }

        let sorted = samplesMs.sorted()
        let p95Index = min(sorted.count - 1, Int(Double(sorted.count - 1) * 0.95))
        let p95 = sorted[p95Index]

        XCTAssertLessThan(
            p95,
            150.0,
            "RSS parser performance gate failed: p95=\(String(format: "%.2f", p95))ms, threshold=150ms"
        )
    }
}

private func duplicateGUIDs(in feed: ExploreSwiftUIRSSFeed) -> [String] {
    let grouped = Dictionary(grouping: feed.items, by: \.guid)
    return grouped
        .filter { $0.value.count > 1 }
        .map(\.key)
        .sorted()
}

private func invalidGUIDItems(in feed: ExploreSwiftUIRSSFeed) -> [ExploreSwiftUIRSSItem] {
    feed.items.filter { item in
        let guid = item.guid.lowercased()
        return !(guid.hasPrefix("http://") || guid.hasPrefix("https://"))
    }
}

private func milliseconds(from duration: Duration) -> Double {
    let components = duration.components
    let seconds = Double(components.seconds)
    let attoseconds = Double(components.attoseconds) / 1_000_000_000_000_000_000.0
    return (seconds + attoseconds) * 1_000.0
}
