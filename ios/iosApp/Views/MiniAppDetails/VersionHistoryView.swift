import ExploreSwiftUI
import SwiftUI

struct VersionHistoryView: View {
    let appId: String

    // Mock Data
    struct Version: Identifiable {
        let id = UUID()
        let version: String
        let date: String
        let notes: String
    }

    let versions = [
        Version(
            version: "2.1.0", date: "2 days ago",
            notes:
                "• Added new dark mode support\n• Fixed crashing issue on startup\n• Performance improvements"
        ),
        Version(
            version: "2.0.5", date: "1 week ago", notes: "• Bug fixes and stability improvements"),
        Version(
            version: "2.0.0", date: "1 month ago",
            notes:
                "• Major update! New UI redesign\n• Added cloud sync feature\n• Improved search functionality"
        ),
        Version(version: "1.5.0", date: "2 months ago", notes: "• Initial release of pro features"),
    ]

    var body: some View {
        UniList {
            ForEach(versions) { item in
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("Version \(item.version)")
                            .font(.headline)

                        Spacer()

                        Text(item.date)
                            .font(.subheadline)
                            .uniForegroundStyle(.secondary)
                    }

                    Text(item.notes)
                        .font(.body)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(.vertical, 8)
            }
        }
        .navigationTitle("Version History")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationView {
        VersionHistoryView(appId: "preview")
    }
}
