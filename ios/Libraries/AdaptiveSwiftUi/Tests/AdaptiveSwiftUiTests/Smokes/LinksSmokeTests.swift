import SwiftUI
import XCTest

@testable import AdaptiveSwiftUi

final class LinksSmokeTests: XCTestCase {
    @MainActor
    func testLinksContractsCompile() {
        _ = LinksSmokeView()
    }
}

private struct LinksSmokeView: View {
    @State private var text = ""
    var body: some View {
        VStack {
            AdaptiveLink("Apple", destination: URL(string: "https://apple.com")!)
            AdaptiveShareLink(item: URL(string: "https://apple.com")!) {
                Text("Share")
            }
            AdaptiveHelpLink(action: URL(string: "https://apple.com/help")!)
            AdaptiveTextFieldLink("Enter", text: $text)
        }
    }
}
