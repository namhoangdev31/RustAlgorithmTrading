import AdaptiveSwiftUi
import SwiftUI

struct UpdateItem: Identifiable {
    let id = UUID()
    let name: String
    let version: String
    let size: String
    let date: String
    let iconName: String
    let iconColor: Color
    let releaseNotes: String
}

struct UpdatesView: View {
    @EnvironmentObject var navigation: NavigationViewModel

    // Mock Data
    @State private var updates: [UpdateItem] = [
        UpdateItem(
            name: "Task Master", version: "2.1.0", size: "45 MB", date: "Yesterday",
            iconName: "checkmark.circle.fill", iconColor: .blue,
            releaseNotes:
                "• Added dark mode support\n• Fixed sync issues\n• Performance improvements"),
        UpdateItem(
            name: "EcoLife", version: "1.4.2", size: "28 MB", date: "2 days ago",
            iconName: "leaf.fill", iconColor: .green,
            releaseNotes: "• New carbon footprint calculator\n• Weekly challenges added"),
        UpdateItem(
            name: "FitPulse", version: "3.0.1", size: "120 MB", date: "Last week",
            iconName: "heart.fill", iconColor: .pink,
            releaseNotes: "• Bug fixes and stability improvements"),
        UpdateItem(
            name: "Pixel Art", version: "1.2.0", size: "65 MB", date: "Last week",
            iconName: "paintbrush.fill", iconColor: .purple,
            releaseNotes: "• New brush tools\n• Layer management improvements"),
    ]

    var body: some View {
        AdaptiveScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Header with Update All
                HStack {
                    VStack(alignment: .leading) {
                        Text("Pending Updates")
                            .font(.headline)
                            .adaptiveForegroundStyle(.secondary)
                        Text("\(updates.count) Apps")
                            .font(.title2)
                            .fontWeight(.bold)
                    }

                    Spacer()

                    AdaptiveButton(action: {
                        // Mock update all
                        updates.removeAll()
                    }) {
                        Text("Update All")
                            .fontWeight(.semibold)
                            .adaptiveForegroundStyle(.white)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 10)
                            .background(Color.blue)
                            .clipShape(Capsule())
                    }
                    .adaptiveButtonStyle(.plain)
                }
                .padding(.top)

                if updates.isEmpty {
                    VStack(spacing: 20) {
                        Spacer(minLength: 50)
                        Image(systemName: "checkmark.shield.fill")
                            .font(.system(size: 60))
                            .adaptiveForegroundStyle(.green)
                        Text("All apps are up to date")
                            .font(.title3)
                            .fontWeight(.medium)
                        Text("Great job keeping your apps secure and feature-rich.")
                            .font(.body)
                            .adaptiveForegroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, 40)
                } else {
                    LazyVStack(spacing: 24) {
                        ForEach(updates) { item in
                            VStack(alignment: .leading, spacing: 12) {
                                HStack(alignment: .top, spacing: 16) {
                                    // Icon
                                    RoundedRectangle(cornerRadius: 12)
                                        .fill(item.iconColor)
                                        .frame(width: 60, height: 60)
                                        .overlay(
                                            Image(systemName: item.iconName)
                                                .font(.title)
                                                .adaptiveForegroundStyle(.white)
                                        )

                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(item.name)
                                            .font(.headline)
                                        Text("Version \(item.version) • \(item.size)")
                                            .font(.subheadline)
                                            .adaptiveForegroundStyle(.secondary)
                                        Text(item.date)
                                            .font(.caption)
                                            .adaptiveForegroundStyle(.secondary)
                                    }

                                    Spacer()

                                    AdaptiveButton(action: {
                                        if let index = updates.firstIndex(where: {
                                            $0.id == item.id
                                        }) {
                                            updates.remove(at: index)
                                        }
                                    }) {
                                        Text("UPDATE")
                                            .font(.caption)
                                            .fontWeight(.bold)
                                            .adaptiveForegroundStyle(.blue)
                                            .padding(.horizontal, 16)
                                            .padding(.vertical, 8)
                                            .background(Color.blue.opacity(0.1))
                                            .clipShape(Capsule())
                                    }
                                    .adaptiveButtonStyle(.plain)
                                }

                                // Release Notes
                                Text(item.releaseNotes)
                                    .font(.system(size: 14))
                                    .adaptiveForegroundStyle(.secondary)
                                    .lineLimit(3)
                                    .padding(.leading, 76)  // Align with text start
                            }

                            AdaptiveDivider()
                                .padding(.leading, 76)
                        }
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Updates")
    }
}
