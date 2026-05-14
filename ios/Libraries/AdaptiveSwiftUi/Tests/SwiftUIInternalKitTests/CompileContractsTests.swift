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
    func testExpandedButtonContractsCompile() {
        _ = AdaptiveButtonSmokeView()
    }

    @MainActor
    func testExpandedTabViewContractsCompile() {
        _ = AdaptiveTabViewSmokeView()
    }

    @MainActor
    func testExpandedPickerContractsCompile() {
        _ = AdaptivePickerSmokeView()
    }

    @MainActor
    func testNavigationShapeSliderContractsCompile() {
        _ = AdaptiveNavigationShapeSliderSmokeView()
    }

    @MainActor
    func testLabelLabeledContentContractsCompile() {
        _ = AdaptiveLabelLabeledContentSmokeView()
    }

    @MainActor
    func testExpandedSheetContractsCompile() {
        _ = AdaptiveSheetSmokeView()
    }

    func testExploreSwiftUIRSSFixtureHasFullCoverage() throws {
        let xmlData = try loadExploreSwiftUIRSSFixtureData()
        let feed = try ExploreSwiftUIRSSParser.parse(data: xmlData)

        XCTAssertEqual(feed.lastBuildDate, "Sat, 18 Apr 2026 11:27:46 GMT")
        XCTAssertEqual(feed.items.count, 184, "RSS must include all published cases from snapshot.")
        
        let componentCounts = Dictionary(grouping: feed.items, by: \.component).mapValues(\.count)
        XCTAssertEqual(componentCounts.count, 28, "RSS must contain all expected components.")
    }
}

// MARK: - Button Smoke Views

private struct AdaptiveButtonSmokeView: View {
    var body: some View {
        VStack {
            // Sizing
            Button("Fitted", action: {})
                .adaptiveButtonSizing(.fitted)
            
            Button("Flexible", action: {})
                .adaptiveButtonSizing(.flexible)
            
            // Roles via AdaptiveRoleButton
            AdaptiveRoleButton(role: .cancel, action: {})
            AdaptiveRoleButton(role: .destructive, title: "Delete", action: {})
            
            // Border Shapes
            Button("Rounded", action: {})
                .adaptiveButtonBorderShape(.roundedRectangle)
            Button("Capsule", action: {})
                .adaptiveButtonBorderShape(.capsule)
            Button("Circle", action: {})
                .adaptiveButtonBorderShape(.circle)
            Button("Custom", action: {})
                .adaptiveButtonBorderShape(.roundedRectangleRadius(12))
        }
    }
}

// MARK: - TabView Smoke Views

private struct AdaptiveTabViewSmokeView: View {
    @State private var selection = "1"
    @State private var customizationData = Data()

    var body: some View {
        if #available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *) {
            TabView(selection: $selection) {
                // Tab Content-only
                Tab { Text("0") }
                
                // Tab title + SF Symbol via AdaptiveValueTab
                AdaptiveValueTab("1", systemImage: "1.circle", value: "1") {
                    Text("1")
                }
                .adaptiveCustomizationID("com.myApp.1")
                
                // Tab title + asset image
                Tab("2", image: "cats24x24", value: "2") {
                    Text("2")
                }
                .adaptiveCustomizationID("com.myApp.2")
                
                // Tab custom label
                Tab(value: "3") {
                    Text("3")
                } label: {
                    Label("3", systemImage: "3.circle")
                }
                .adaptiveCustomizationID("com.myApp.3")
                .adaptiveCustomizationBehavior(.disabled, for: [.sidebar])
                
                // Search role
                AdaptiveValueTab("Search", systemImage: "magnifyingglass", value: "search", role: .search) {
                    Text("Search")
                }
                
                // Section
                AdaptiveTabSection("Section") {
                    Tab("Sub", systemImage: "star", value: "sub") { Text("Sub") }
                }
                .adaptiveSectionActions {
                    Button("Plus", systemImage: "plus") {}
                }
            }
            .adaptiveTabViewStyle(.sidebarAdaptable)
            .adaptiveTabViewStyle(.tabBarOnly)
            .adaptiveTabViewCustomization($customizationData)
            .adaptiveTabViewSidebarHeader { Text("Header") }
            .adaptiveTabViewSidebarFooter { Text("Footer") }
            .adaptiveTabViewSidebarBottomBar { Text("Bottom") }
            .adaptiveDefaultAdaptableTabBarPlacement(.tabBar)
        }
        
        // Page Styles
        TabView {
            Text("P1")
            Text("P2")
        }
        .adaptiveTabViewStyle(.page)
        .adaptiveTabViewStyle(.page(indexDisplayMode: .never))
    }
}

// MARK: - Picker Smoke Views

private struct AdaptivePickerSmokeView: View {
    @State private var selection = "1"
    @State private var sources = [CatSource(id: 1, size: "S"), CatSource(id: 2, size: "L")]

    var body: some View {
        VStack {
            Picker("Title", selection: $selection) {
                Text("1").tag("1")
                Section("Group") {
                    Text("2").tag("2")
                }
                Divider()
                Text("3").tag("3")
            }
            
            Picker("SF Symbol", systemImage: "hand.tap", selection: $selection) {
                Text("1").tag("1")
            }
            
            AdaptiveValueLabelPicker(selection: $selection) {
                Text("1").tag("1")
            } label: {
                Label("Custom", systemImage: "star")
            } currentValueLabel: {
                Text("Current: \(selection)")
            }
            
            // Styles
            Picker("Style", selection: $selection) { Text("1").tag("1") }
                .adaptivePickerStyle(.segmented)
                .adaptivePickerStyle(.wheel)
                .adaptivePickerStyle(.menu)
                .adaptivePickerStyle(.inline)
                .adaptivePickerStyle(.navigationLink)
                .adaptivePickerStyle(.palette)
            
            // Multiple sources
            Picker("Sources", sources: $sources, selection: \.size) {
                Text("S").tag("S")
                Text("L").tag("L")
            }
            
            // Radio group + layout
            #if os(macOS)
            Picker("Radio", selection: $selection) { Text("1").tag("1") }
                .adaptivePickerStyle(.radioGroup)
                .adaptiveHorizontalRadioGroupLayout()
            #endif
            
            // Wheel height
            Picker("Wheel", selection: $selection) { Text("1").tag("1") }
                .adaptivePickerStyle(.wheel)
                .adaptiveDefaultWheelPickerItemHeight(48)
        }
    }
}

struct CatSource: Identifiable {
    let id: Int
    var size: String
}

// MARK: - Navigation / Shape / Slider Smoke Views

private struct AdaptiveNavigationShapeSliderSmokeView: View {
    @State private var percentage = 0.5

    var body: some View {
        VStack {
            NavigationStack {
                Text("Content")
                    .adaptiveContainerBackground(.blue.gradient, for: .navigation)
            }
            
            NavigationSplitView {
                Text("Sidebar")
                    .adaptiveContainerBackground(.thinMaterial, for: .navigation)
                    .adaptiveContainerBackground(.blue.gradient, for: .navigationSplitView)
            } detail: {
                Text("Detail")
                    .adaptiveContainerBackground(.ultraThinMaterial, for: .navigation)
            }
            
            // Shapes
            ConcentricRectangle()
                .fill(Color.blue)
                .frame(height: 50)
            
            ConcentricRectangle(corners: .concentric, isUniform: true)
                .fill(Color.red)
            
            // Slider with ticks
            AdaptiveTickedSlider(
                value: $percentage,
                in: 0...1,
                step: 0.25,
                tickValues: [0.0, 0.25, 0.5, 0.75, 1.0]
            ) {
                Text("Percentage")
            } currentValueLabel: {
                Text("\(Int(percentage * 100))%")
            } minimumValueLabel: {
                Text("0%")
            } maximumValueLabel: {
                Text("100%")
            } tickLabel: { tick in
                Text("\(Int(tick * 100))%")
            }
        }
    }
}

// MARK: - Label / LabeledContent Smoke Views

private struct AdaptiveLabelLabeledContentSmokeView: View {
    var body: some View {
        VStack {
            AdaptiveLabeledContent("Basic", value: "Value")
            AdaptiveLabeledContent("Amount", value: 42, format: .currency(code: "EUR"))
            AdaptiveLabeledContent {
                Button("Action") {}
            } label: {
                Label("Custom", systemImage: "star")
            }
            
            Label("SF", systemImage: "water.waves")
                .adaptiveLabelStyle(.titleAndIcon)
                .adaptiveLabelStyle(.titleOnly)
                .adaptiveLabelStyle(.iconOnly)
            
            Label {
                Text("Title")
            } icon: {
                Image(systemName: "star")
            }
        }
    }
}

// MARK: - Sheet Smoke Views

private struct AdaptiveSheetSmokeView: View {
    @State private var showSheet = false
    @State private var item: SheetItem?

    var body: some View {
        Text("Sheets")
            .sheet(isPresented: $showSheet) {
                Text("Sheet Content")
                    .adaptiveInteractiveDismissDisabled()
                    .adaptivePresentationDetents([.medium, .height(200), .fraction(0.1)])
                    .adaptivePresentationDragIndicator(.visible)
                    .adaptivePresentationBackground(.blue)
                    .adaptivePresentationSizing(.fitted)
                    .adaptivePresentationSizing(.page)
            }
            .sheet(item: $item) { itm in
                Text("Item \(itm.id)")
            }
    }
}

struct SheetItem: Identifiable {
    let id: UUID = UUID()
}

// MARK: - RSS Parser (Duplicated for target independence)

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
