import SwiftUI

@available(iOS 26.0, *)
struct HelpSupportView: View {
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        List {
            Section(header: Text("Common Issues")) {
                NavigationLink("Account & Login", destination: Text("Account & Login Help"))
                NavigationLink("Payments & Refunds", destination: Text("Payments Help"))
                NavigationLink("App Installation", destination: Text("Installation Help"))
            }
            
            Section(header: Text("Contact Us")) {
                Link("Email Support", destination: URL(string: "mailto:support@lepos.com")!)
                Link("Visit Help Center", destination: URL(string: "https://help.lepos.com")!)
            }
            
            Section {
                Button("Report a Problem") {
                    // Action
                }
            }
        }
        .navigationTitle("Help & Support")
        .navigationBarTitleDisplayMode(.inline)
    }
}
