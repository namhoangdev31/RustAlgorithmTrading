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
    @State private var submittedText = ""
    
    var body: some View {
        Form {
            Section("Links") {
                // Standard Link
                AdaptiveLink("Visit Apple", destination: URL(string: "https://apple.com")!)
                
                // Link with Custom Label
                AdaptiveLink(destination: URL(string: "https://swift.org")!) {
                    Label("Swift.org", systemImage: "link")
                }
            }
            
            Section("Sharing") {
                // Standard ShareLink
                AdaptiveShareLink("Share Apple", item: URL(string: "https://apple.com")!)
                
                // ShareLink with Preview and Custom Label
                AdaptiveShareLink(
                    item: URL(string: "https://apple.com")!,
                    preview: AdaptiveSharePreview("Apple Website", image: Image(systemName: "applelogo"))
                ) {
                    Label("Share with Preview", systemImage: "square.and.arrow.up")
                }
            }
            
            Section("Specialized Links") {
                // HelpLink (Requires action closure)
                AdaptiveHelpLink {
                    print("Help requested")
                }
                
                // TextFieldLink (watchOS polyfill, requires onSubmit)
                AdaptiveTextFieldLink("Enter Name", prompt: Text("Your Name")) { value in
                    self.submittedText = value
                }
                
                if !submittedText.isEmpty {
                    Text("Submitted: \(submittedText)")
                }
            }
        }
    }
}
