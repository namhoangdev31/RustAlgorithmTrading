import SwiftUI
import XCTest

@testable import AdaptiveSwiftUi

final class LabeledContentSmokeTests: XCTestCase {
    @MainActor
    func testLabeledContentContractsCompile() {
        _ = LabeledContentSmokeView()
    }
}

private struct LabeledContentSmokeView: View {
    var body: some View {
        List {
            Section("Custom Layout") {
                // Testing init(content:label:)
                AdaptiveLabeledContent {
                    Text("Custom Content")
                        .foregroundColor(.blue)
                } label: {
                    Label("Title with Icon", systemImage: "info.circle")
                }
            }
            
            Section("Title and Value (String)") {
                // Testing init(_:value:)
                AdaptiveLabeledContent("Status", value: "Completed")
                
                // Testing LocalizedStringKey variant
                AdaptiveLabeledContent(LocalizedStringKey("Version"), value: "1.0.0")
            }
            
            Section("Formatted Values") {
                // Testing init(_:value:format:)
                if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, *) {
                    AdaptiveLabeledContent("Price", value: 1250.5, format: .currency(code: "USD"))
                    AdaptiveLabeledContent("Progress", value: 0.75, format: .percent)
                } else {
                    // Fallback test for older versions if needed
                    AdaptiveLabeledContent("Price", value: "1250.5 USD")
                }
            }
        }
    }
}
