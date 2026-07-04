import ExploreSwiftUI
import SwiftUI

struct HelpSupportView: View {
    @EnvironmentObject private var navigation: NavigationViewModel
    @Environment(\.dismiss) var dismiss

    var body: some View {
        UniList {
            Section(header: Text("Common Issues")) {
                UniButton(action: { navigation.navigate(to: .helpDetail(title: "Account & Login")) }) {
                    HStack {
                        Text("Account & Login")
                            .uniForegroundStyle(.primary)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .uniForegroundStyle(.secondary)
                    }
                }
                .uniButtonStyle(.plain)

                UniButton(action: { navigation.navigate(to: .helpDetail(title: "Payments & Refunds")) }) {
                    HStack {
                        Text("Payments & Refunds")
                            .uniForegroundStyle(.primary)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .uniForegroundStyle(.secondary)
                    }
                }
                .uniButtonStyle(.plain)

                UniButton(action: { navigation.navigate(to: .helpDetail(title: "App Installation")) }) {
                    HStack {
                        Text("App Installation")
                            .uniForegroundStyle(.primary)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .uniForegroundStyle(.secondary)
                    }
                }
                .uniButtonStyle(.plain)
            }

            Section(header: Text("Contact Us")) {
                Link("Email Support", destination: URL(string: "mailto:support@lepos.com")!)
                Link("Visit Help Center", destination: URL(string: "https://help.lepos.com")!)
            }

            Section {
                UniButton("Report a Problem") {
                    // Action
                }
                .uniButtonStyle(.plain)
            }
        }
        .navigationTitle("Help & Support")
        .navigationBarTitleDisplayMode(.inline)
    }
}
