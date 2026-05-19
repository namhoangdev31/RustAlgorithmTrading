import ExploreSwiftUI
import SwiftUI

struct AppStorageView: View {
    let appId: String

    var body: some View {
        UniList {
            Section(header: Text("Storage Usage")) {
                HStack {
                    Text("App Size")
                    Spacer()
                    Text("48.5 MB")
                        .foregroundColor(.secondary)
                }

                HStack {
                    Text("Documents & Data")
                    Spacer()
                    Text("12.4 MB")
                        .foregroundColor(.secondary)
                }

                HStack {
                    Text("Total")
                        .fontWeight(.medium)
                    Spacer()
                    Text("60.9 MB")
                        .fontWeight(.medium)
                }
            }

            Section {
                UniButton(action: {
                    // Clear cache action
                }) {
                    Text("Offload App")
                        .uniForegroundStyle(.blue)
                }
                .uniButtonStyle(.plain)

                UniButton(action: {
                    // Delete documents action
                }) {
                    Text("Delete Documents & Data")
                        .uniForegroundStyle(.red)
                }
                .uniButtonStyle(.plain)
            } footer: {
                Text(
                    "Offloading the app will free up storage used by the app, but keep its documents and data. Reinstalling the app will place back your data if the app is still available."
                )
            }
        }
        .navigationTitle("Storage")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationView {
        AppStorageView(appId: "preview")
    }
}
