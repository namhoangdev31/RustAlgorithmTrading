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

    @MainActor
    func testCoreAdaptiveModifiersCompileInOneView() {
        _ = AdaptiveLibrarySmokeView()
    }

    @MainActor
    func testTabCustomizationStorageWrapperCompiles() {
        _ = Text("Demo")
            .adaptiveTabViewCustomization(.constant(Data()))
    }

    @MainActor
    func testNavigationAndToolbarContractsCompile() {
        _ = AdaptiveNavigationToolbarSmokeView()
    }

    @MainActor
    func testComponentContractsCompile() {
        _ = AdaptiveComponentSmokeView()
    }

    @MainActor
    func testAdvancedTabContractsCompile() {
        _ = AdaptiveAdvancedTabSmokeView()
    }

    @MainActor
    func testGaugeContractsCompile() {
        _ = AdaptiveGaugeSmokeView()
    }

    @MainActor
    func testControlGroupContractsCompile() {
        _ = AdaptiveControlGroupSmokeView()
    }

    @MainActor
    func testTickedSliderLabeledContractCompiles() {
        _ = AdaptiveTickedSliderSmokeView()
    }

    @MainActor
    func testParityFixContractsCompile() {
        _ = AdaptiveParityFixSmokeView()
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
        XCTAssertEqual(feed.items.first?.guid, "https://exploreswiftui.com/elements/190")
        XCTAssertEqual(feed.items.last?.guid, "https://exploreswiftui.com/elements/1")
    }
}

private struct AdaptiveLibrarySmokeView: View {
    @State private var detent: AdaptivePresentationDetent = .medium

    var body: some View {
        VStack(spacing: 16) {
            Text("Surface")
                .padding(12)
                .adaptiveGlass()
                .adaptiveConcentricSurface(fill: Color.blue.opacity(0.1))

            Picker("Mode", selection: .constant("1")) {
                Text("1").tag("1")
                Text("2").tag("2")
            }
            .adaptivePickerStyle(.menu)

            List {
                Section("Header") {
                    Text("Row")
                        .adaptiveListRowSeparator(.visible)
                        .adaptiveListRowSeparatorTint(.blue)
                        .adaptiveSwipeActions {
                            Button("Action") {}
                        }
                        .adaptiveListBadge(1)
                        .adaptiveListRowBackground {
                            Color.blue.opacity(0.1)
                        }
                }
                .adaptiveSectionIndexLabel("H")
            }
            .adaptiveListSectionSpacing(.compact)
            .adaptiveListRowSpacing(4)
            .adaptiveListSectionIndexVisibility(.automatic)
            .adaptiveRefreshable {}

            Text("Sheet APIs")
                .adaptivePresentationDetents([.medium, .large], selection: $detent)
                .adaptivePresentationContentInteraction(.scrolls)
                .adaptivePresentationBackgroundInteraction(.enabled)
                .adaptivePresentationCornerRadius(16)
        }
        .adaptiveTabViewStyle(.automatic)
    }
}

private struct AdaptiveNavigationToolbarSmokeView: View {
    var body: some View {
        NavigationStack {
            List {
                Text("Nav")
            }
            .adaptiveContainerBackground(.thinMaterial, for: .navigation)
            .toolbar {
                ToolbarItem(placement: .adaptive(.title)) {
                    Text("Title")
                }
                ToolbarItem(placement: .primaryAction) {
                    Button("A") {}
                }
                .adaptiveSharedBackgroundVisibility(.hidden)
                AdaptiveToolbarSpacer(.fixed, placement: .primaryAction)
                ToolbarItem(placement: .primaryAction) {
                    Button("B") {}
                }
            }
        }
    }
}

private struct AdaptiveComponentSmokeView: View {
    @State private var selected = "1"
    @State private var dates: Set<DateComponents> = []
    @State private var sliderValue = 0.5

    var body: some View {
        VStack(spacing: 12) {
            AdaptiveLabeledContent {
                Text("Amount")
            } valueContent: {
                Text("42")
            }

            AdaptiveShareLink(item: URL(string: "https://example.com")!) {
                Label("Share", systemImage: "square.and.arrow.up")
            }

            AdaptiveValueLabelPicker(selection: $selected) {
                Text("1").tag("1")
                Text("2").tag("2")
            } label: {
                Text("Mode")
            } currentValueLabel: {
                Text("Current: \(selected)")
            }

            AdaptiveMultiDatePicker(selection: $dates) {
                Text("Dates")
            }

            AdaptiveTickedSlider(
                value: $sliderValue,
                in: 0...1,
                step: 0.25,
                tickValues: [0.25, 0.5, 0.75]
            ) {
                Text("Progress")
            } currentValueLabel: {
                Text("\(sliderValue)")
            } minimumValueLabel: {
                Text("0")
            } maximumValueLabel: {
                Text("1")
            }

            AdaptiveFormattedText(1234.56, format: .number)
            AdaptiveRenameButton {}
            AdaptivePasteButton { _ in }

            AdaptiveMenuActionButton {
                Button("One") {}
                Button("Two") {}
            } label: {
                Text("Menu")
            } primaryAction: {
            }
        }
    }
}

private struct AdaptiveAdvancedTabSmokeView: View {
    @State private var selection = "home"

    var body: some View {
        if #available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *) {
            TabView(selection: $selection) {
                AdaptiveValueTab("Home", systemImage: "house", value: "home") {
                    Text("Home")
                }

                TabSection("More") {
                    Tab("Search", systemImage: "magnifyingglass", value: "search", role: .search) {
                        Text("Search")
                    }
                }
                .adaptiveSectionActions {
                    Button("Add") {}
                }
            }
            .adaptiveTabViewStyle(.sidebarAdaptable)
        } else {
            TabView {
                Text("Legacy")
            }
        }
    }
}

// MARK: - New smoke views for expanded API surface

private struct AdaptiveGaugeSmokeView: View {
    var body: some View {
        VStack(spacing: 12) {
            // Init: value + label
            AdaptiveGauge(value: 0.5) {
                Text("Speed")
            }

            // Init: value + in range + label
            AdaptiveGauge(value: 50, in: 0...100) {
                Text("Temperature")
            }

            // Init: value + label + currentValueLabel
            AdaptiveGauge(value: 0.75) {
                Text("Battery")
            } currentValueLabel: {
                Text("75%")
            }

            // Init: value + in range + label + currentValueLabel
            AdaptiveGauge(value: 30, in: 0...100) {
                Text("Volume")
            } currentValueLabel: {
                Text("30 dB")
            }

            // Init: value + in range + label + current/min/max
            AdaptiveGauge(value: 60, in: 0...100) {
                Text("Progress")
            } currentValueLabel: {
                Text("60%")
            } minimumValueLabel: {
                Text("0")
            } maximumValueLabel: {
                Text("100")
            }
        }
        .adaptiveGaugeStyle(.automatic)
    }
}

private struct AdaptiveControlGroupSmokeView: View {
    var body: some View {
        VStack(spacing: 12) {
            // No label
            AdaptiveControlGroup {
                Button("A") {}
                Button("B") {}
            }

            // Title + systemImage
            AdaptiveControlGroup("Format", systemImage: "textformat") {
                Button("Bold") {}
                Button("Italic") {}
            }

            // Custom ViewBuilder label
            AdaptiveControlGroup {
                Button("Undo") {}
                Button("Redo") {}
            } label: {
                HStack {
                    Image(systemName: "arrow.uturn.backward")
                    Text("History")
                }
            }
        }
        .adaptiveControlGroupStyle(.automatic)
    }
}

private struct AdaptiveTickedSliderSmokeView: View {
    @State private var value = 0.5

    var body: some View {
        VStack(spacing: 12) {
            // Tick without label (existing)
            AdaptiveTickedSlider(
                value: $value,
                in: 0...1,
                tickValues: [0.25, 0.5, 0.75]
            ) {
                Text("Level")
            } currentValueLabel: {
                Text("\(value)")
            } minimumValueLabel: {
                Text("Min")
            } maximumValueLabel: {
                Text("Max")
            }

            // Tick with custom label (new)
            AdaptiveTickedSlider(
                value: $value,
                in: 0...1,
                step: 0.25,
                tickValues: [0.0, 0.25, 0.5, 0.75, 1.0]
            ) {
                Text("Volume")
            } currentValueLabel: {
                Text("\(value, specifier: "%.0f%%")")
            } minimumValueLabel: {
                Image(systemName: "speaker.fill")
            } maximumValueLabel: {
                Image(systemName: "speaker.wave.3.fill")
            } tickLabel: { tick in
                Text("\(Int(tick * 100))")
            }
        }
    }
}

private struct AdaptiveParityFixSmokeView: View {
    var body: some View {
        VStack(spacing: 16) {
            NavigationStack {
                List {
                    Section("A") {
                        Text("Row")
                    }
                    .adaptiveSectionIndexLabel("A")
                }
                .adaptiveListSectionIndexVisibility(.visible)
                // containerBackground parity: .navigation
                .adaptiveContainerBackground(.ultraThinMaterial, for: .navigation)
                // containerBackground parity: .navigationSplitView
                .adaptiveContainerBackground(for: .navigationSplitView) {
                    Color.blue.opacity(0.1)
                }
            }

            if #available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *) {
                TabView {
                    Tab("Main", systemImage: "square.grid.2x2") {
                        Text("Main")
                    }
                    Tab("Search", systemImage: "magnifyingglass") {
                        Text("Search")
                    }
                    .adaptiveCustomizationBehavior(.disabled, for: [.tabBar])
                }
                .adaptiveTabViewStyle(.sidebarAdaptable)
            }
        }
    }
}

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
