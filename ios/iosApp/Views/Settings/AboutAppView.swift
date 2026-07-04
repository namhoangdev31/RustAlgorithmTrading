import ExploreSwiftUI
import SwiftUI

struct AboutAppView: View {
    @EnvironmentObject private var navigation: NavigationViewModel

    var body: some View {
        UniList {
            Section {
                VStack(spacing: 16) {
                    Image(systemName: "app.dashed")  // App Icon placeholder
                        .resizable()
                        .scaledToFit()
                        .frame(width: 80, height: 80)
                        .uniForegroundStyle(.blue)

                    Text("Lepos App")
                        .font(.title2)
                        .uniBold()

                    Text("Version 1.0.0 (Build 100)")
                        .font(.subheadline)
                        .uniForegroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical)
            }
            .listRowBackground(Color.clear)

            Section(header: Text("Legal")) {
                UniButton(action: { navigation.navigate(to: .legal(type: "terms")) }) {
                    HStack {
                        Text("Terms of Service")
                            .uniForegroundStyle(.primary)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .uniForegroundStyle(.secondary)
                    }
                }
                .uniButtonStyle(.plain)

                UniButton(action: { navigation.navigate(to: .legal(type: "privacy")) }) {
                    HStack {
                        Text("Privacy Policy")
                            .uniForegroundStyle(.primary)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .uniForegroundStyle(.secondary)
                    }
                }
                .uniButtonStyle(.plain)

                UniButton(action: { navigation.navigate(to: .legal(type: "licenses")) }) {
                    HStack {
                        Text("Licenses")
                            .uniForegroundStyle(.primary)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .uniForegroundStyle(.secondary)
                    }
                }
                .uniButtonStyle(.plain)
            }

            Section {
                Text("Made with ❤️ by the Lepos Team")
                    .frame(maxWidth: .infinity, alignment: .center)
                    .font(.caption)
                    .uniForegroundStyle(.secondary)
            }
            .listRowBackground(Color.clear)
        }
        .navigationTitle("About")
        .navigationBarTitleDisplayMode(.inline)
    }
}
